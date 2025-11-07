from django.db import connection, transaction, DatabaseError
from django.db.models import Q # Para a consulta da lista de processos
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.response import Response
from rest_framework import status
import json 
import base64 # Para o upload de arquivos

# --- 1. Imports de Modelos ---
from .models import (
    Animais, 
    Etapas, 
    TipoUsuario, 
    Template, 
    Usuarios, 
    EtapaRelacao, 
    Processo, 
    ProcessoEtapa,
    Solicitacao,
    Recusa,
    Entrevista, # <-- Importar
    Visitacao  # <-- Importar
)

# --- 2. Imports de Serializers ---
from .serializers import (
    AnimaisSerializer, 
    EtapasSerializer, 
    TipoUsuarioSerializer,
    TemplateSerializer,
    UsuariosSerializer,
    ProcessoEtapaDetalhadoSerializer, 
    SolicitacaoSerializer,
    RecusaSerializer,
    EntrevistaSerializer, # <-- Importar
    VisitacaoSerializer,  # <-- Importar
    ProcessoListSerializer
)


# ---
# API 1: Listar Animais
# ---
class AnimaisListView(ListAPIView):
    queryset = Animais.objects.all()
    serializer_class = AnimaisSerializer 

# ---
# API 2: Listar Etapas (para o TemplateCreator)
# ---
class EtapasListView(ListAPIView):
    queryset = Etapas.objects.all()
    serializer_class = EtapasSerializer

# ---
# API 3: Listar Tipos de Usuário (para o TemplateCreator)
# ---
class TipoUsuarioListView(ListAPIView):
    queryset = TipoUsuario.objects.all()
    serializer_class = TipoUsuarioSerializer

# ---
# API 4: Criar Template (com transação manual)
# ---
class TemplateCreateView(APIView):
    def post(self, request, *args, **kwargs):
        template_name = request.data.get('nome')
        fluxo_json = request.data.get('fluxo_json') 

        if not template_name or not fluxo_json:
            return Response(
                {"error": "Nome do template e fluxo_json são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            with connection.cursor() as cursor:
                cursor.execute("START TRANSACTION")
                try:
                    cursor.execute("SET max_sp_recursion_depth = 255;") 
                    cursor.execute("INSERT INTO Template (nome) VALUES (%s)", [template_name])
                    cursor.execute("SELECT LAST_INSERT_ID()")
                    new_template_id = cursor.fetchone()[0]

                    if not new_template_id:
                        raise Exception("Não foi possível obter o ID do novo template.")

                    for etapa in fluxo_json:
                        etapa['template'] = new_template_id
                    
                    flux_json_string = json.dumps(fluxo_json)
                    
                    cursor.execute("SET @json_in = %s", [flux_json_string])
                    cursor.execute("CALL insereEtapa_Relacao(@json_in)")
                    
                    cursor.execute("COMMIT") 

                    return Response(
                        {
                            "message": "Template criado com sucesso!",
                            "template_id": new_template_id,
                            "nome": template_name
                        },
                        status=status.HTTP_201_CREATED
                    )
                except Exception as e:
                    cursor.execute("ROLLBACK") 
                    raise e
        except DatabaseError as e: 
            error_message = str(e)
            if "MESSAGE_TEXT" in error_message:
                try:
                    error_message = error_message.split("MESSAGE_TEXT = '")[1].split("'")[0]
                except:
                    pass 
            return Response(
                {"error": f"Falha no banco de dados: {error_message}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
             return Response(
                {"error": f"Erro inesperado: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ---
# API 5: Listar Templates (para a página de Serviços)
# ---
class TemplateListView(ListAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

# ---
# API 6: Login
# ---
class LoginView(APIView):
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        senha = request.data.get('senha')

        if not email or not senha:
            return Response(
                {"error": "Email e senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            usuario = Usuarios.objects.get(email=email)
            
            if usuario.senha == senha:
                serializer = UsuariosSerializer(usuario)
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    {"error": "Credenciais inválidas."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Usuarios.DoesNotExist:
            return Response(
                {"error": "Credenciais inválidas."},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response(
                {"error": f"Erro no servidor: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# ---
# API 7: Iniciar um Processo
# ---
class ProcessoStartView(APIView):
    def post(self, request, *args, **kwargs):
        template_id = request.data.get('template_id')
        usuario_id = request.data.get('usuario_id') 

        if not template_id or not usuario_id:
            return Response(
                {"error": "Template ID e Usuário ID são obrigatórios."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            usuario = Usuarios.objects.get(usuario_id=usuario_id)
            primeira_etapa_relacao = EtapaRelacao.objects.filter(template_id=template_id).latest('etapa_relacao_id')
            
            if primeira_etapa_relacao.responsavel.tipo_id != usuario.tipo_usuario.tipo_id:
                return Response(
                    {"error": "Você não tem permissão para iniciar este processo."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            with transaction.atomic():
                novo_processo = Processo.objects.create(
                    template_id=template_id,
                    usuario_id=usuario_id,
                    status_field='Em Andamento' 
                )
                
                primeira_processo_etapa = ProcessoEtapa.objects.get(
                    processo=novo_processo,
                    status_field='Em Andamento'
                )
                
                return Response(
                    {"processo_etapa_id": primeira_processo_etapa.processo_etapa_id},
                    status=status.HTTP_201_CREATED
                )
        except EtapaRelacao.DoesNotExist:
            return Response({"error": "Template inválido ou sem etapas."}, status=status.HTTP_404_NOT_FOUND)
        except Usuarios.DoesNotExist:
            return Response({"error": "Usuário não encontrado."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": f"Erro interno do servidor: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---
# API 8: Buscar Detalhes de uma Etapa de Processo (GET)
# ---
class ProcessoEtapaDetailView(RetrieveAPIView):
    """
    API que retorna os detalhes de UMA Processo_Etapa específica.
    GET /api/processo/etapa/<id>/
    """
    queryset = ProcessoEtapa.objects.all()
    serializer_class = ProcessoEtapaDetalhadoSerializer
    # 'pk' (Primary Key) da URL será usada para buscar o ID

# ---
# API 9: Submeter Formulário de Solicitação (POST)
# ---
class SolicitacaoSubmitView(APIView):
    """
    API para submeter o formulário da etapa "Solicitação".
    POST /api/etapa/solicitacao/submit/
    """
    def post(self, request, *args, **kwargs):
        cpf = request.data.get('cpf')
        animal_id = request.data.get('animal_id')
        comprovante_file_base64 = request.data.get('comprovante')
        processo_etapa_id = request.data.get('processo_etapa_id')
        proximo_etapa_relacao_id = request.data.get('proximo_etapa_relacao_id')

        if not all([cpf, animal_id, comprovante_file_base64, processo_etapa_id, proximo_etapa_relacao_id]):
            return Response({"error": "Todos os campos são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            comprovante_blob = base64.b64decode(comprovante_file_base64)

            with transaction.atomic():
                # 1. Salva na tabela 'solicitacao'
                Solicitacao.objects.create(
                    processo_etapa_id=processo_etapa_id,
                    cpf=cpf,
                    animal_id=animal_id,
                    comprovante_residencia=comprovante_blob
                )

                # 2. Atualiza a etapa ATUAL ("Solicitação") para "Concluído"
                etapa_atual = ProcessoEtapa.objects.get(processo_etapa_id=processo_etapa_id)
                etapa_atual.status_field = 'Concluído'
                etapa_atual.save()

                # 3. Encontra a próxima etapa ("Análise")
                proxima_etapa = ProcessoEtapa.objects.get(
                    processo=etapa_atual.processo,
                    etapa_relacao_id=proximo_etapa_relacao_id
                )
                
                # 4. Atribui o novo responsável (Admin) a esta etapa
                proxima_etapa.status_field = 'Em Andamento'
                
                proximo_responsavel_tipo_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                
                primeiro_usuario_compativel = Usuarios.objects.filter(tipo_usuario_id=proximo_responsavel_tipo_id).first()
                
                if not primeiro_usuario_compativel:
                    raise Exception(f"Nenhum usuário encontrado para o tipo de responsável ID: {proximo_responsavel_tipo_id}")

                proxima_etapa.usuario = primeiro_usuario_compativel
                proxima_etapa.save()

                return Response(
                    {"message": "Solicitação enviada com sucesso!", "next_etapa_id": proxima_etapa.processo_etapa_id},
                    status=status.HTTP_200_OK
                )
        
        except ProcessoEtapa.DoesNotExist:
             return Response({"error": "Etapa do processo não encontrada."}, status=404)
        except Exception as e:
            return Response({"error": f"Erro ao submeter: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---
# API 10: Listar "Meus Processos" (GET)
# ---
class ProcessoListView(ListAPIView):
    """
    API que lista os processos do usuário.
    GET /api/processos/meus/?usuario_id=<id>
    """
    serializer_class = ProcessoListSerializer
    
    def get_queryset(self):
        usuario_id = self.request.query_params.get('usuario_id')
        if not usuario_id:
            return Processo.objects.none() 

        try:
            # Filtro 1: Processos que eu INICIEI
            iniciados_por_mim = Q(usuario_id=usuario_id)
            
            # Filtro 2: Processos onde uma etapa "Em Andamento" está ATRIBUÍDA a mim
            atribuidos_a_mim = Q(processoetapa__usuario_id=usuario_id, processoetapa__status_field='Em Andamento')

            # Combina os filtros (OU) e remove duplicatas
            queryset = Processo.objects.filter(
                iniciados_por_mim | atribuidos_a_mim
            ).distinct().order_by('-processo_id') # Mais recentes primeiro
            
            return queryset
        except Exception as e:
            print(f"Erro ao buscar queryset de ProcessoListView: {e}")
            return Processo.objects.none()

# ---
# API 11: Encaminhar uma Etapa (API de Decisão Genérica)
# ---
class EncaminharEtapaView(APIView):
    """
    API genérica para avançar o fluxo de um processo (usada pela "Análise" e "Aprovação").
    POST /api/etapa/encaminhar/
    """
    def post(self, request, *args, **kwargs):
        processo_etapa_id_atual = request.data.get('processo_etapa_id_atual')
        proxima_etapa_relacao_id = request.data.get('proxima_etapa_relacao_id')

        if not processo_etapa_id_atual or not proxima_etapa_relacao_id:
            return Response({"error": "IDs da etapa atual e próxima são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Atualiza a etapa ATUAL (ex: "Análise") para "Concluído"
                etapa_atual = ProcessoEtapa.objects.get(processo_etapa_id=processo_etapa_id_atual)
                etapa_atual.status_field = 'Concluído'
                etapa_atual.save()

                # 2. Encontra a PRÓXIMA etapa (ex: "Aprovação" ou "Recusa")
                proxima_etapa = ProcessoEtapa.objects.get(
                    processo=etapa_atual.processo,
                    etapa_relacao_id=proxima_etapa_relacao_id
                )
                
                # 3. Ativa a próxima etapa e atribui o responsável
                proxima_etapa.status_field = 'Em Andamento'
                
                proximo_responsavel_tipo_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                
                primeiro_usuario_compativel = Usuarios.objects.filter(tipo_usuario_id=proximo_responsavel_tipo_id).first()
                
                if not primeiro_usuario_compativel:
                    raise Exception(f"Nenhum usuário encontrado para o tipo de responsável ID: {proximo_responsavel_tipo_id}")

                proxima_etapa.usuario = primeiro_usuario_compativel
                proxima_etapa.save()

                return Response(
                    {"message": "Etapa encaminhada com sucesso!", "next_etapa_id": proxima_etapa.processo_etapa_id},
                    status=status.HTTP_200_OK
                )
        
        except ProcessoEtapa.DoesNotExist:
             return Response({"error": "Etapa do processo não encontrada."}, status=404)
        except Exception as e:
            return Response({"error": f"Erro ao encaminhar: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---
# API 12: Submeter Formulário de Recusa (POST)
# ---
class RecusaSubmitView(APIView):
    """
    API para submeter o formulário da etapa "Recusa", salvando a justificativa.
    POST /api/etapa/recusa/submit/
    """
    def post(self, request, *args, **kwargs):
        # Dados do formulário
        justificativa = request.data.get('justificativa')
        
        # IDs de controle
        processo_etapa_id = request.data.get('processo_etapa_id')
        proximo_etapa_relacao_id = request.data.get('proximo_etapa_relacao_id')

        if not all([justificativa, processo_etapa_id, proximo_etapa_relacao_id]):
            return Response({"error": "Todos os campos são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Salva na tabela 'recusa'
                Recusa.objects.create(
                    processo_etapa_id=processo_etapa_id,
                    justificativa=justificativa
                )

                # 2. Atualiza a etapa ATUAL ("Recusa") para "Concluído"
                etapa_atual = ProcessoEtapa.objects.get(processo_etapa_id=processo_etapa_id)
                etapa_atual.status_field = 'Concluído'
                etapa_atual.save()

                # 3. Encontra a próxima etapa ("Conclusão")
                proxima_etapa = ProcessoEtapa.objects.get(
                    processo=etapa_atual.processo,
                    etapa_relacao_id=proximo_etapa_relacao_id
                )
                
                # 4. Ativa a próxima etapa ("Conclusão") e atribui o responsável
                proxima_etapa.status_field = 'Em Andamento'
                
                proximo_responsavel_tipo_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                primeiro_usuario_compativel = Usuarios.objects.filter(tipo_usuario_id=proximo_responsavel_tipo_id).first()
                
                if not primeiro_usuario_compativel:
                    raise Exception(f"Nenhum usuário encontrado para o tipo de responsável ID: {proximo_responsavel_tipo_id}")

                proxima_etapa.usuario = primeiro_usuario_compativel
                proxima_etapa.save()

                # 5. Opcional: Marcar o processo PAI como "Recusado"
                processo_pai = etapa_atual.processo
                processo_pai.status_field = 'Recusado'
                processo_pai.save() 
                # (Isso também vai disparar seu trigger tg_Processo_apagarSequencia)

                return Response(
                    {"message": "Processo recusado e encaminhado para conclusão."},
                    status=status.HTTP_200_OK
                )
        
        except ProcessoEtapa.DoesNotExist:
             return Response({"error": "Etapa do processo não encontrada."}, status=404)
        except Exception as e:
            return Response({"error": f"Erro ao submeter recusa: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---
# API 13: Concluir um Processo (POST)
# ---
class ProcessoConcluirView(APIView):
    """
    API para finalizar uma etapa de Conclusão e marcar o 
    processo PAI como "Concluído".
    POST /api/processo/concluir/
    """
    def post(self, request, *args, **kwargs):
        # Recebe o ID da etapa atual (a etapa de "Conclusão")
        processo_etapa_id = request.data.get('processo_etapa_id')

        if not processo_etapa_id:
            return Response({"error": "ID da etapa do processo é obrigatório."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                # 1. Encontra a etapa atual (ex: "Conclusão")
                etapa_atual = ProcessoEtapa.objects.get(processo_etapa_id=processo_etapa_id)
                
                # 2. Marca esta etapa como "Concluído"
                etapa_atual.status_field = 'Concluído'
                etapa_atual.save()

                # 3. Encontra o processo PAI
                processo_pai = etapa_atual.processo
                
                # 4. Marca o processo PAI como "Concluído"
                processo_pai.status_field = 'Concluído'
                processo_pai.save() 
                
                # (Isto irá disparar seu trigger 'tg_Processo_apagarSequencia' 
                # e limpar as etapas "Não Iniciado")

                return Response(
                    {"message": "Processo concluído com sucesso!"},
                    status=status.HTTP_200_OK
                )
        
        except ProcessoEtapa.DoesNotExist:
             return Response({"error": "Etapa do processo não encontrada."}, status=404)
        except Exception as e:
            return Response({"error": f"Erro ao concluir processo: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---
# API 14: Submeter Formulário de Entrevista (POST)
# ---
class EntrevistaSubmitView(APIView):
    """
    API para submeter o formulário da etapa "Entrevista".
    POST /api/etapa/entrevista/submit/
    """
    def post(self, request, *args, **kwargs):
        data_ = request.data.get('data_')
        observacoes = request.data.get('observacoes')
        processo_etapa_id = request.data.get('processo_etapa_id')
        proximo_etapa_relacao_id = request.data.get('proximo_etapa_relacao_id')

        if not all([data_, processo_etapa_id, proximo_etapa_relacao_id]):
            return Response({"error": "Data, ID da etapa e ID da próxima etapa são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = EntrevistaSerializer(data={
            "data_field": data_,
            "observacoes": observacoes,
            "processo_etapa": processo_etapa_id
        })

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # 1. Salva na tabela 'entrevista'
                    serializer.save()

                    # 2. Atualiza a etapa ATUAL ("Entrevista") para "Concluído"
                    etapa_atual = ProcessoEtapa.objects.get(processo_etapa_id=processo_etapa_id)
                    etapa_atual.status_field = 'Concluído'
                    etapa_atual.save()

                    # 3. Encontra a próxima etapa (ex: "Análise Entrevista")
                    proxima_etapa = ProcessoEtapa.objects.get(
                        processo=etapa_atual.processo,
                        etapa_relacao_id=proximo_etapa_relacao_id
                    )
                    
                    # 4. Atribui o novo responsável a esta etapa
                    proxima_etapa.status_field = 'Em Andamento'
                    proximo_responsavel_tipo_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                    primeiro_usuario_compativel = Usuarios.objects.filter(tipo_usuario_id=proximo_responsavel_tipo_id).first()
                    
                    if not primeiro_usuario_compativel:
                        raise Exception(f"Nenhum usuário encontrado para o tipo de responsável ID: {proximo_responsavel_tipo_id}")

                    proxima_etapa.usuario = primeiro_usuario_compativel
                    proxima_etapa.save()

                    return Response(
                        {"message": "Entrevista agendada com sucesso!", "next_etapa_id": proxima_etapa.processo_etapa_id},
                        status=status.HTTP_200_OK
                    )
            
            except DatabaseError as e:
                # Captura o erro do trigger (SQLSTATE 45000)
                if '45000' in str(e):
                    error_message = str(e).split("MESSAGE_TEXT = '")[1].split("'")[0]
                    return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)
                return Response({"error": f"Erro de banco de dados: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except ProcessoEtapa.DoesNotExist:
                 return Response({"error": "Etapa do processo não encontrada."}, status=404)
            except Exception as e:
                return Response({"error": f"Erro ao submeter: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ---
# API 15: Submeter Formulário de Visitação (POST)
# ---
class VisitacaoSubmitView(APIView):
    """
    API para submeter o formulário da etapa "Visitação".
    POST /api/etapa/visitacao/submit/
    """
    def post(self, request, *args, **kwargs):
        data_ = request.data.get('data_')
        endereco = request.data.get('endereco')
        processo_etapa_id = request.data.get('processo_etapa_id')
        proximo_etapa_relacao_id = request.data.get('proximo_etapa_relacao_id')

        if not all([data_, endereco, processo_etapa_id, proximo_etapa_relacao_id]):
            return Response({"error": "Data, Endereço, ID da etapa e ID da próxima etapa são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = VisitacaoSerializer(data={
            "data_field": data_,
            "endereco": endereco,
            "processo_etapa": processo_etapa_id
        })

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # 1. Salva na tabela 'visitacao'
                    serializer.save()

                    # 2. Atualiza a etapa ATUAL ("Visitação") para "Concluído"
                    etapa_atual = ProcessoEtapa.objects.get(processo_etapa_id=processo_etapa_id)
                    etapa_atual.status_field = 'Concluído'
                    etapa_atual.save()

                    # 3. Encontra a próxima etapa (ex: "Análise Visitação")
                    proxima_etapa = ProcessoEtapa.objects.get(
                        processo=etapa_atual.processo,
                        etapa_relacao_id=proximo_etapa_relacao_id
                    )
                    
                    # 4. Atribui o novo responsável a esta etapa
                    proxima_etapa.status_field = 'Em Andamento'
                    proximo_responsavel_tipo_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                    primeiro_usuario_compativel = Usuarios.objects.filter(tipo_usuario_id=proximo_responsavel_tipo_id).first()
                    
                    if not primeiro_usuario_compativel:
                        raise Exception(f"Nenhum usuário encontrado para o tipo de responsável ID: {proximo_responsavel_tipo_id}")

                    proxima_etapa.usuario = primeiro_usuario_compativel
                    proxima_etapa.save()

                    return Response(
                        {"message": "Visitação agendada com sucesso!", "next_etapa_id": proxima_etapa.processo_etapa_id},
                        status=status.HTTP_200_OK
                    )
            
            except DatabaseError as e:
                # Captura o erro do trigger (SQLSTATE 45000)
                if '45000' in str(e):
                    error_message = str(e).split("MESSAGE_TEXT = '")[1].split("'")[0]
                    return Response({"error": error_message}, status=status.HTTP_400_BAD_REQUEST)
                return Response({"error": f"Erro de banco de dados: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            except ProcessoEtapa.DoesNotExist:
                 return Response({"error": "Etapa do processo não encontrada."}, status=404)
            except Exception as e:
                return Response({"error": f"Erro ao submeter: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)