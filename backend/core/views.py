from django.db import connection, DatabaseError, transaction
from django.http import JsonResponse
# 1. IMPORTAR RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView 
from rest_framework.response import Response
from rest_framework import status
import json 
import base64 # Para lidar com o arquivo de upload
from django.db.models import Q

# Imports dos Models
from .models import (
    Animais, 
    Etapas, 
    TipoUsuario,
    Template,
    Usuarios,
    EtapaRelacao,
    Processo,
    ProcessoEtapa,
    Solicitacao # 2. IMPORTAR Solicitacao
)
# Imports dos Serializers
from .serializers import (
    AnimaisSerializer, 
    EtapasSerializer, 
    TipoUsuarioSerializer,
    TemplateSerializer,
    UsuariosSerializer,
    ProcessoEtapaDetalhadoSerializer, # 3. IMPORTAR os novos serializers
    SolicitacaoSerializer,
    ProcessoListSerializer
)

# ---
# 1. API para a lista de Animais (inalterada)
# ---
class AnimaisListView(ListAPIView):
    queryset = Animais.objects.all()
    serializer_class = AnimaisSerializer 

# ---
# 2. & 3. APIs de Apoio (inalteradas)
# ---
class EtapasListView(ListAPIView):
    queryset = Etapas.objects.all()
    serializer_class = EtapasSerializer

class TipoUsuarioListView(ListAPIView):
    queryset = TipoUsuario.objects.all()
    serializer_class = TipoUsuarioSerializer

# ---
# 4. API para CRIAR O TEMPLATE (inalterada)
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
                    cursor.execute("INSERT INTO Template (nome) VALUES (%s)", [template_name])
                    cursor.execute("SELECT LAST_INSERT_ID()")
                    new_template_id = cursor.fetchone()[0]

                    if not new_template_id:
                        raise Exception("Não foi possível obter o ID do novo template.")

                    for etapa in fluxo_json:
                        etapa['template'] = new_template_id

                    flux_json_string = json.dumps(fluxo_json)
                    cursor.callproc('insereEtapa_Relacao', [flux_json_string])
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
# 5. API PARA LOGIN (inalterada)
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
                    {"error": "Email ou senha inválidos."}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
        except Usuarios.DoesNotExist:
            return Response(
                {"error": "Email ou senha inválidos."}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            return Response({"error": f"Erro interno: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# ---
# 6. API PARA LISTAR TEMPLATES (inalterada)
# ---
class TemplateListView(ListAPIView):
    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

# ---
# 7. API PARA INICIAR UM PROCESSO (inalterada)
# ---
class ProcessoStartView(APIView):
    """
    Cria uma nova instância de Processo.
    POST /api/processos/start/
    """
    def post(self, request, *args, **kwargs):
        template_id = request.data.get('template_id')
        usuario_id = request.data.get('usuario_id') # Vem do loggedInUser

        if not template_id or not usuario_id:
            return Response(
                {"error": "Template ID e Usuário ID são obrigatórios."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # --- Lógica de Autorização (Checagem de segurança no backend) ---
            usuario = Usuarios.objects.get(usuario_id=usuario_id)
            primeira_etapa_relacao = EtapaRelacao.objects.filter(template_id=template_id).latest('etapa_relacao_id')
            
            # Compara o tipo_id do responsável (ex: 2) com o tipo_id do usuário (ex: 2)
            if primeira_etapa_relacao.responsavel_id != usuario.tipo_usuario_id:
                return Response(
                    {"error": "Você não tem permissão para iniciar este processo."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            # --- Lógica de Criação (Foco no DB) ---
            with transaction.atomic():
                # 1. Cria o Processo (Isso dispara o trigger)
                novo_processo = Processo.objects.create(
                    template_id=template_id,
                    usuario_id=usuario_id, # <-- Passa o ID da Ana
                    status_field='Em Andamento' 
                )
                
                # 2. O trigger (tg_Processo_criacaoProcesso_Etapa.sql)
                #    JÁ RODOU e usou o 'usuario_id' da Ana.
                
                # 3. Busca a primeira etapa criada pelo trigger
                primeira_processo_etapa = ProcessoEtapa.objects.get(
                    processo=novo_processo,
                    status_field='Em Andamento'
                )
                
                # 4. Retorna o ID da etapa para o frontend
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
# 8. ADICIONAR NOVA VIEW (GET) PARA DETALHES DA ETAPA
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
# 9. ADICIONAR NOVA VIEW (POST) PARA SUBMETER SOLICITAÇÃO
# ---
class SolicitacaoSubmitView(APIView):
    """
    API para submeter o formulário da etapa "Solicitação".
    POST /api/etapa/solicitacao/submit/
    """
    def post(self, request, *args, **kwargs):
        # Dados do formulário
        cpf = request.data.get('cpf')
        animal_id = request.data.get('animal_id')
        comprovante_file_base64 = request.data.get('comprovante') # Vem como string Base64
        
        # IDs de controle
        processo_etapa_id = request.data.get('processo_etapa_id')
        proximo_etapa_relacao_id = request.data.get('proximo_etapa_relacao_id')

        if not all([cpf, animal_id, comprovante_file_base64, processo_etapa_id, proximo_etapa_relacao_id]):
            return Response({"error": "Todos os campos são obrigatórios."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Converte o Base64 de volta para bytes (BLOB)
            comprovante_blob = base64.b64decode(comprovante_file_base64)

            with transaction.atomic():
                # 1. Salva na tabela 'solicitacao' (o foco do seu trabalho)
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

                # 3. Encontra a próxima etapa ("Análise") e a define como "Em Andamento"
                proxima_etapa = ProcessoEtapa.objects.get(
                    processo=etapa_atual.processo,
                    etapa_relacao_id=proximo_etapa_relacao_id
                )
                
                # 4. Atribui o novo responsável (Admin) a esta etapa
                proxima_etapa.status_field = 'Em Andamento'
                # Pega o ID do tipo de usuário (ex: 1) do responsável pela próxima etapa
                proximo_responsavel_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                
                # Atribui a etapa ao PRIMEIRO usuário daquele tipo (ex: o primeiro Admin)
                # NOTA: Isso é uma simplificação. O ideal seria ter uma tela de "distribuição"
                primeiro_usuario_compativel = Usuarios.objects.filter(tipo_usuario_id=proximo_responsavel_id).first()
                
                if not primeiro_usuario_compativel:
                    raise Exception(f"Nenhum usuário encontrado para o tipo de responsável ID: {proximo_responsavel_id}")

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
        
class ProcessoListView(ListAPIView):
    """
    API que lista os processos do usuário.
    """
    serializer_class = ProcessoListSerializer
    
    def get_queryset(self):
        usuario_id = self.request.query_params.get('usuario_id')
        if not usuario_id:
            return Processo.objects.none() 

        # Filtro 1: Processos que eu INICIEI
        iniciados_por_mim = Q(usuario_id=usuario_id)
        
        # Filtro 2: Processos onde uma etapa "Em Andamento" está ATRIBUÍDA a mim
        atribuidos_a_mim = Q(processoetapa__usuario_id=usuario_id, processoetapa__status_field='Em Andamento')

        # Combina os filtros (OU) e remove duplicatas
        queryset = Processo.objects.filter(
            iniciados_por_mim | atribuidos_a_mim
        ).distinct().order_by('-processo_id') # Mais recentes primeiro
        
        return queryset
    
class EncaminharEtapaView(APIView):
    """
    API genérica para avançar o fluxo de um processo.
    Marca a etapa atual como 'Concluído' e ativa a próxima.
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
                
                # Pega o ID do tipo de usuário (ex: 1) do responsável pela próxima etapa
                proximo_responsavel_tipo_id = proxima_etapa.etapa_relacao.responsavel.tipo_id
                
                # Atribui a etapa ao PRIMEIRO usuário daquele tipo
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