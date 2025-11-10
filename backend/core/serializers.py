import base64
from rest_framework import serializers
from rest_framework.fields import Field
from .models import (
    Animais,
    Entrevista,
    EtapaRelacao,
    Etapas,
    Processo,
    ProcessoEtapa,
    Recusa,
    Solicitacao, 
    Template,
    TipoUsuario,
    Usuarios,
    Validacao,
    Visitacao
)

#converter as fotos/comprovante
class FotoSerializerField(serializers.Field):
    def to_representation(self, value):
        if not value:
            return None

        try:
            # Garante que value é bytes
            if isinstance(value, memoryview):
                value = value.tobytes()
            elif isinstance(value, bytearray):
                value = bytes(value)
            elif isinstance(value, str):
                # Se vier como string tipo "b'%PDF-1.7...'", limpa
                value = value.encode('latin1')

            # Detecta tipo 
            mime_type = "application/octet-stream"
            try:
                header = value[:1024]  # Lê os primeiros bytes
                if b"%PDF" in header:
                    mime_type = "application/pdf"
                elif header.startswith(b"\xff\xd8\xff"):
                    mime_type = "image/jpeg"
                elif header.startswith(b"\x89PNG\r\n\x1a\n"):
                    mime_type = "image/png"
                elif header.startswith(b"GIF87a") or header.startswith(b"GIF89a"):
                    mime_type = "image/gif"
            except Exception as e:
                print("Erro detectando MIME:", e)

            # converte para Base64
            encoded = base64.b64encode(value).decode('utf-8')
            print(">>> MIME:", mime_type, "| primeiros bytes:", value[:10])

            return f"data:{mime_type};base64,{encoded}"

        except Exception as e:
            print("Erro ao converter arquivo:", e)
            return None

    def to_internal_value(self, data):
        try:
            #base64 -> bytes, decodifica a parte depois da virgula
            if ',' in data:
                _, encoded = data.split(',', 1)
                return base64.b64decode(encoded)
            return None
        except Exception as e:
            print("Erro ao decodificar arquivo:", e)
            return None

#pra mostrar os animais, usa o fotoserializer pra conseguir mostrar a foto na pagina
class AnimaisSerializer(serializers.ModelSerializer):
    foto = FotoSerializerField(required=False)

    class Meta:
        model = Animais
        fields = ['animal_id', 'nome', 'sexo', 'idade', 'tipo', 'foto']

#de apoio
class EtapasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etapas
        fields = '__all__'

class TipoUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoUsuario
        fields = '__all__'

#login
class UsuariosSerializer(serializers.ModelSerializer):
    #mostra tudo que tem na tabela de tipo usuario
    tipo_usuario_detalhes = TipoUsuarioSerializer(source='tipo_usuario', read_only=True)
    #pega o id q define o tipo
    tipo_usuario = serializers.ReadOnlyField(source='tipo_usuario.tipo_id')

    class Meta:
        model = Usuarios
        fields = ('usuario_id', 'nome', 'idade', 'email', 'tipo_usuario', 'tipo_usuario_detalhes')

# pra exibir o template
class TemplateSerializer(serializers.ModelSerializer):
    #pega o usuario responsavel pela primeira etapa (o que iniciou ele)
    primeira_etapa_responsavel_id = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ('template_id', 'nome', 'primeira_etapa_responsavel_id')

#pra saber quem pode iniciar esse processo
    def get_primeira_etapa_responsavel_id(self, obj):
        try:
            #busca todas as etapas que tem nesse template
            primeira_etapa = EtapaRelacao.objects.filter(
                template=obj
            ).latest('etapa_relacao_id') #pega  amais recente (que eh a primeira)
            return primeira_etapa.responsavel_id # Acesso direto ao ID
        except EtapaRelacao.DoesNotExist:
            return None

# Mostra os dados da solicitação
class SolicitacaoSerializer(serializers.ModelSerializer):
    comprovante_residencia = FotoSerializerField(read_only=True)
    animal = AnimaisSerializer(read_only=True)

    class Meta:
        model = Solicitacao
        fields = ['solicitacao_id', 'animal', 'cpf', 'comprovante_residencia'] 

# Enviar recusa
class RecusaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recusa
        fields = ['justificativa', 'processo_etapa']

class EntrevistaSerializer(serializers.ModelSerializer):  
    class Meta:
        model = Entrevista
        fields = ['data_field', 'observacoes', 'processo_etapa']

class VisitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitacao
        fields = ['data_field', 'endereco', 'processo_etapa']

#leitura dos dados da entrevista (usado depois na analise)
class EntrevistaReadOnlySerializer(serializers.ModelSerializer):
    class Meta:
        model = Entrevista
        fields = ['data_field', 'observacoes']

#leitura dos dados da visitação (usado depois na analise)
class VisitacaoReadOnlySerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitacao
        fields = ['data_field', 'endereco']

#só pra mostrar o basico de uma relação com id e etapa 
class EtapaRelacaoSimplesSerializer(serializers.ModelSerializer):
    etapa = EtapasSerializer(read_only=True) 
    class Meta:
        model = EtapaRelacao
        fields = ['etapa_relacao_id', 'etapa']

#não foi usado...
class ValidacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacao
        fields = ['validacao_id', 'descricao']

#mostra tudo que uma etapa tem vinculado a ela
class EtapaRelacaoDetalhadaSerializer(serializers.ModelSerializer):
    etapa = EtapasSerializer(read_only=True)
    responsavel = TipoUsuarioSerializer(read_only=True)
    proximo = EtapaRelacaoSimplesSerializer(read_only=True) 
    alternativo = EtapaRelacaoSimplesSerializer(read_only=True) 

    class Meta:
        model = EtapaRelacao
        fields = ['etapa_relacao_id', 'etapa', 'responsavel', 'proximo', 'alternativo']


# mostra tudo da etapa atual, o usuario que executa e quem solicitou
class ProcessoEtapaDetalhadoSerializer(serializers.ModelSerializer):
    etapa_relacao = EtapaRelacaoDetalhadaSerializer(read_only=True)
    usuario = UsuariosSerializer(read_only=True)
    solicitante = UsuariosSerializer(source='processo.usuario', read_only=True)
    
    # Adiciona os dados dos formulários de etapas anteriores (usar na analise)
    dados_solicitacao = serializers.SerializerMethodField()
    dados_entrevista = serializers.SerializerMethodField()
    dados_visitacao = serializers.SerializerMethodField()

    class Meta:
        model = ProcessoEtapa
        fields = [
            'processo_etapa_id', 
            'processo', 
            'status_field', 
            'etapa_relacao', 
            'usuario', 
            'solicitante',
            'dados_solicitacao',
            'dados_entrevista',
            'dados_visitacao'
        ]

    def get_dados_solicitacao(self, obj):
        try:
            solicitacao = Solicitacao.objects.get(processo_etapa__processo=obj.processo)
            return SolicitacaoSerializer(solicitacao).data
        except Solicitacao.DoesNotExist:
            return None
        except Solicitacao.MultipleObjectsReturned:
            solicitacao = Solicitacao.objects.filter(processo_etapa__processo=obj.processo).first()
            return SolicitacaoSerializer(solicitacao).data

    def get_dados_entrevista(self, obj):
        try:
            entrevista = Entrevista.objects.get(processo_etapa__processo=obj.processo)
            return EntrevistaReadOnlySerializer(entrevista).data
        except Entrevista.DoesNotExist:
            return None
        except Entrevista.MultipleObjectsReturned:
            entrevista = Entrevista.objects.filter(processo_etapa__processo=obj.processo).first()
            return EntrevistaReadOnlySerializer(entrevista).data

    def get_dados_visitacao(self, obj):
        try:
            visitacao = Visitacao.objects.get(processo_etapa__processo=obj.processo)
            return VisitacaoReadOnlySerializer(visitacao).data
        except Visitacao.DoesNotExist:
            return None
        except Visitacao.MultipleObjectsReturned:
            visitacao = Visitacao.objects.filter(processo_etapa__processo=obj.processo).first()
            return VisitacaoReadOnlySerializer(visitacao).data


# ---
# SERIALIZERS PARA A PÁGINA "MEUS PROCESSOS"
# ---

#mostra o resumo simples de cada etapa
class ProcessoEtapaSimplesSerializer(serializers.ModelSerializer):
    etapa_nome = serializers.CharField(source='etapa_relacao.etapa.nome')
    usuario_nome = serializers.CharField(source='usuario.nome', allow_null=True)

    class Meta:
        model = ProcessoEtapa
        fields = ['processo_etapa_id', 'etapa_nome', 'usuario_nome', 'status_field']

#resumo atual do processo
class ProcessoListSerializer(serializers.ModelSerializer):
    template_nome = serializers.CharField(source='template.nome')
    etapa_atual = serializers.SerializerMethodField()
    usuario = UsuariosSerializer(read_only=True)

    class Meta:
        model = Processo
        fields = ['processo_id', 'template_nome', 'status_field', 'usuario', 'etapa_atual']

#busca no banco a etapa "em andamento" do processo atual pra mostrar onde ta
    def get_etapa_atual(self, obj):
        try:
            etapa = ProcessoEtapa.objects.get(processo=obj, status_field='Em Andamento')
            return ProcessoEtapaSimplesSerializer(etapa).data
        except ProcessoEtapa.DoesNotExist:
            return None
        except ProcessoEtapa.MultipleObjectsReturned:
            etapa = ProcessoEtapa.objects.filter(processo=obj, status_field='Em Andamento').latest('processo_etapa_id')
            return ProcessoEtapaSimplesSerializer(etapa).data