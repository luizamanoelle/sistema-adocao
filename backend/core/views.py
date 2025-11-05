import json
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import connection, transaction
from django.db.utils import IntegrityError, OperationalError

# Importa os modelos
from .models import Animais, Etapas, TipoUsuario, Template
# Importa os serializers (o AnimaisSerializer já faz a conversão)
from .serializers import (
    AnimaisSerializer, 
    EtapasSerializer, 
    TipoUsuarioSerializer
)

# ---
# VIEWS (ENDPOINTS DA API)
# ---

class AnimaisListView(ListAPIView):
    """
    Endpoint para listar todos os animais.
    Usa o AnimaisSerializer (de serializers.py) que já converte as fotos.
    """
    queryset = Animais.objects.all()
    serializer_class = AnimaisSerializer

# ---
# NOVAS VIEWS PARA O CRIADOR DE TEMPLATES
# ---

class EtapasListView(ListAPIView):
    """
    Endpoint (somente leitura) para listar as Etapas disponíveis
    (Ex: 1: Solicitação, 2: Análise, etc.)
    O frontend usa isso para ajudar o usuário a escrever o JSON.
    """
    queryset = Etapas.objects.all()
    serializer_class = EtapasSerializer

class TipoUsuarioListView(ListAPIView):
    """
    Endpoint (somente leitura) para listar os Tipos de Usuário disponíveis
    (Ex: 1: Administrador, 2: Adotante, etc.)
    O frontend usa isso para o campo 'responsavel' do JSON.
    """
    queryset = TipoUsuario.objects.all()
    serializer_class = TipoUsuarioSerializer

class TemplateCreateView(APIView):
    """
    Endpoint principal para CRIAR um novo template e seu fluxo.
    Este endpoint chama a procedure `insereEtapa_Relacao`
    """
    
    def post(self, request, *args, **kwargs):
        # 1. Pega os dados do React
        nome_template = request.data.get('nome')
        fluxo_json = request.data.get('fluxo_json') # Espera um objeto/lista Python

        if not nome_template or not fluxo_json:
            return Response(
                {"error": "Os campos 'nome' e 'fluxo_json' são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        new_template_id = None
        try:
            # 2. Inicia uma transação. Se algo falhar, tudo é desfeito (rollback).
            with transaction.atomic():
                
                # 3. Cria o Template (INSERT na tabela Template)
                with connection.cursor() as cursor:
                    cursor.execute(
                        "INSERT INTO Template (nome) VALUES (%s)", 
                        [nome_template]
                    )
                    # Pega o ID do template que acabamos de criar
                    cursor.execute("SELECT LAST_INSERT_ID()")
                    new_template_id = cursor.fetchone()[0]

                if not new_template_id:
                    raise IntegrityError("Não foi possível obter o ID do novo template.")

                # 4. Prepara o JSON para a Procedure
                # A procedure espera que o `template_id` esteja *dentro* do JSON
                # Vamos injetar o `new_template_id` em cada etapa do fluxo
                for etapa in fluxo_json:
                    etapa['template'] = new_template_id
                
                # Converte o JSON de Python para String (que o MySQL espera)
                fluxo_json_string = json.dumps(fluxo_json) # <-- Variável definida corretamente

                # 5. Chama a Procedure `insereEtapa_Relacao`
                with connection.cursor() as cursor:
                    # --- CORREÇÃO AQUI ---
                    # A procedure espera 1 argumento (o JSON),
                    # não 0 argumentos com uma variável de sessão.
                    
                    # Removemos o cursor.execute("SET @json_data ...")
                    
                    # Chamamos a procedure passando a string JSON como argumento
                    cursor.callproc('insereEtapa_Relacao', [fluxo_json_string])
                    # ---------------------


            # 6. Se tudo deu certo (commit da transação é automático)
            return Response(
                {
                    "message": "Template e fluxo criados com sucesso!",
                    "template_id": new_template_id,
                    "nome": nome_template
                },
                status=status.HTTP_201_CREATED
            )

        except (IntegrityError, OperationalError) as e:
            # 7. Se algo falhou, a transação é desfeita (rollback)
            # Retorna a mensagem de erro (pode ser da sua trigger ou procedure!)
            error_message = str(e)
            
            # Tenta extrair a mensagem de erro específica do SQL (ex: "Erro: Usuário já possui...")
            if hasattr(e, 'args') and len(e.args) > 1:
                # e.args[0] é o código de erro (ex: 1644), e.args[1] é a mensagem
                sql_error_message = str(e.args[1])
                error_message = sql_error_message
            
            return Response(
                {"error": f"Falha no banco de dados: {error_message}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            # Pega qualquer outro erro inesperado
            return Response(
                {"error": f"Ocorreu um erro inesperado: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )