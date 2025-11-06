from django.db import connection, transaction
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
import json # Importe o JSON

#aqui importa os modelos
from .models import Animais, Etapas, TipoUsuario, Template, Usuarios

#aqui importa os serializers
from .serializers import (
    AnimaisSerializer, 
    EtapasSerializer, 
    TipoUsuarioSerializer,
    TemplateSerializer,
    UsuariosSerializer
)


# API para a lista de Animais 
class AnimaisListView(ListAPIView):
    queryset = Animais.objects.all()
    # Usa o serializer que converte o BLOB da foto para Base64
    serializer_class = AnimaisSerializer 


# APIs de Apoio para o Criador de Templates (etapas)
class EtapasListView(ListAPIView):
    queryset = Etapas.objects.all()
    serializer_class = EtapasSerializer


# APIs de apoio pro criador de templates (usuarios)
class TipoUsuarioListView(ListAPIView):
    queryset = TipoUsuario.objects.all()
    serializer_class = TipoUsuarioSerializer

# API Principal para CRIAR O TEMPLATE
class TemplateCreateView(APIView):
    
    def post(self, request, *args, **kwargs):
        template_name = request.data.get('nome')
        fluxo_json = request.data.get('fluxo_json') # Recebe o JSON (como lista de dicts)

        if not template_name or not fluxo_json:
            return Response(
                {"error": "Nome do template e fluxo_json são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Inicia uma transação: ou tudo funciona, ou nada é salvo.
            with transaction.atomic():
                with connection.cursor() as cursor:
                    
                    cursor.execute("SET max_sp_recursion_depth = 255;")
                    # 1. Cria o Template (pai) e obtém o seu ID
                    cursor.execute("INSERT INTO Template (nome) VALUES (%s)", [template_name])
                    cursor.execute("SELECT LAST_INSERT_ID()")
                    new_template_id = cursor.fetchone()[0]


                    if not new_template_id:
                        raise Exception("Não foi possível obter o ID do novo template.")

                    # 2. Injeta o new_template_id em CADA etapa do fluxo
                    for etapa in fluxo_json:
                        etapa['template'] = new_template_id

                    # 3. Converte o JSON modificado para uma string
                    flux_json_string = json.dumps(fluxo_json)


                    print("DEBUG: fluxo_json recebido:", fluxo_json)
                    print("DEBUG: tipo de fluxo_json:", type(fluxo_json))
                    print("DEBUG: JSON final enviado para o MySQL:", flux_json_string)

                    
                    # 1. Definimos a variável de sessão com o JSON
                    # O driver do Python/Django vai lidar corretamente com a string aqui.
                    print("DEBUG: Definindo @json_in com:", flux_json_string[:300])
                    cursor.execute("SET @json_in = %s", [flux_json_string])
                    
                    # 2. Chamamos a procedure usando a variável de sessão
                    print("DEBUG: Chamando procedure com @json_in...")
                    cursor.execute("CALL insereEtapa_Relacao(@json_in)")
                    
                    print("DEBUG: Procedure executada com sucesso!")

                    # Se chegou aqui, a procedure funcionou
                    return Response(
                        {
                            "message": "Template criado com sucesso!",
                            "template_id": new_template_id,
                            "nome": template_name
                        },
                        status=status.HTTP_201_CREATED
                    )

        except Exception as e:
            # Captura qualquer erro (incluindo o SIGNAL da procedure)
            error_message = str(e)
            
            # Tenta extrair a mensagem de erro específica do MySQL
            if "MESSAGE_TEXT" in error_message:
                try:
                    # Extrai a mensagem de erro que definimos no SIGNAL
                    error_message = error_message.split("MESSAGE_TEXT = '")[1].split("'")[0]
                except:
                    pass # Mantém a mensagem original se a extração falhar

            return Response(
                {"error": f"Falha no banco de dados: {error_message}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# API pra listas os templates 
class TemplateListView(ListAPIView):

    queryset = Template.objects.all()
    serializer_class = TemplateSerializer

class LoginView(APIView):
    """
    View de Login simples.
    Recebe 'email' e 'senha' e retorna os dados do usuário.
    """
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        senha = request.data.get('senha')

        if not email or not senha:
            return Response(
                {"error": "Email e senha são obrigatórios."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # ATENÇÃO: Isso é inseguro para produção (senha em texto plano)
            # Mas funciona para o seu schema de banco atual.
            usuario = Usuarios.objects.get(email=email, senha=senha)
            
            # Usa o serializer para retornar dados seguros
            serializer = UsuariosSerializer(usuario)
            return Response(serializer.data, status=status.HTTP_200_OK)

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
