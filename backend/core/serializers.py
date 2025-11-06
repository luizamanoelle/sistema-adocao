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

# ---
# CAMPO SERIALIZER CUSTOMIZADO PARA FOTOS (BLOB -> Base64)
# ---
class FotoSerializerField(Field):
    def to_representation(self, value):
        if value:
            mime_type = "image/png"
            return f"data:{mime_type};base64,{base64.b64encode(value).decode('utf-8')}"
        return None

# ---
# SERIALIZERS DE APOIO
# ---
class AnimaisSerializer(serializers.ModelSerializer):
    foto = FotoSerializerField(read_only=True)
    class Meta:
        model = Animais
        fields = '__all__'

class EtapasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etapas
        fields = '__all__'

class TipoUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoUsuario
        fields = '__all__'

# ---
# SERIALIZER DE LOGIN (COM A CORREÇÃO DO 'tipo_usuario')
# ---
class UsuariosSerializer(serializers.ModelSerializer):
    tipo_usuario_detalhes = TipoUsuarioSerializer(source='tipo_usuario', read_only=True)
    tipo_usuario = serializers.ReadOnlyField(source='tipo_usuario.tipo_id')

    class Meta:
        model = Usuarios
        fields = ('usuario_id', 'nome', 'idade', 'email', 'tipo_usuario', 'tipo_usuario_detalhes')

# ---
# SERIALIZER DE TEMPLATES (COM A REGRA DE NEGÓCIO)
# ---
class TemplateSerializer(serializers.ModelSerializer):
    primeira_etapa_responsavel_id = serializers.SerializerMethodField()

    class Meta:
        model = Template
        fields = ('template_id', 'nome', 'primeira_etapa_responsavel_id')

    def get_primeira_etapa_responsavel_id(self, obj):
        try:
            primeira_etapa = EtapaRelacao.objects.filter(
                template=obj
            ).latest('etapa_relacao_id')
            return primeira_etapa.responsavel_id # Acesso direto ao ID
        except EtapaRelacao.DoesNotExist:
            return None


# ---
# SERIALIZERS PARA A PÁGINA DE ETAPA
# ---

class SolicitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitacao
        fields = ['animal', 'cpf', 'comprovante_residencia'] 


class EtapaRelacaoSimplesSerializer(serializers.ModelSerializer):
    """
    Serializer 'raso' para mostrar os detalhes dos botões 
    'proximo' e 'alternativo'.
    """
    etapa = EtapasSerializer(read_only=True) 
    
    class Meta:
        model = EtapaRelacao
        fields = ['etapa_relacao_id', 'etapa']


class EtapaRelacaoDetalhadaSerializer(serializers.ModelSerializer):
    """
    Serializer 'profundo' que mostra os detalhes COMPLETOS 
    de uma EtapaRelacao, incluindo seus filhos.
    """
    etapa = EtapasSerializer(read_only=True)
    responsavel = TipoUsuarioSerializer(read_only=True)
    proximo = EtapaRelacaoSimplesSerializer(read_only=True) 
    alternativo = EtapaRelacaoSimplesSerializer(read_only=True) 

    class Meta:
        model = EtapaRelacao
        fields = ['etapa_relacao_id', 'etapa', 'responsavel', 'proximo', 'alternativo']


class ProcessoEtapaDetalhadoSerializer(serializers.ModelSerializer):
    """
    O serializer principal da página.
    Ele puxa o ProcessoEtapa e todos os seus detalhes aninhados.
    """
    etapa_relacao = EtapaRelacaoDetalhadaSerializer(read_only=True)
    usuario = UsuariosSerializer(read_only=True) 

    class Meta:
        model = ProcessoEtapa
        fields = ['processo_etapa_id', 'processo', 'status_field', 'etapa_relacao', 'usuario']


# ---
# SERIALIZERS PARA A PÁGINA "MEUS PROCESSOS" (ORDEM CORRIGIDA)
# ---

# 1. ProcessoEtapaSimplesSerializer (DEFINIDO PRIMEIRO)
class ProcessoEtapaSimplesSerializer(serializers.ModelSerializer):
    """
    Serializer 'super-simples' para a lista de processos.
    Mostra apenas o nome da etapa e o nome do responsável.
    """
    etapa_nome = serializers.CharField(source='etapa_relacao.etapa.nome')
    usuario_nome = serializers.CharField(source='usuario.nome', allow_null=True)

    class Meta:
        model = ProcessoEtapa
        fields = ['processo_etapa_id', 'etapa_nome', 'usuario_nome', 'status_field']


# 2. ProcessoListSerializer (DEFINIDO DEPOIS, AGORA PODE USAR O DE CIMA)
class ProcessoListSerializer(serializers.ModelSerializer):
    """
    Serializer para a lista "Meus Processos".
    """
    template_nome = serializers.CharField(source='template.nome')
    etapa_atual = serializers.SerializerMethodField()
    usuario = UsuariosSerializer(read_only=True)

    class Meta:
        model = Processo
        fields = ['processo_id', 'template_nome', 'status_field', 'usuario', 'etapa_atual']

    def get_etapa_atual(self, obj):
        """
        Encontra a etapa que está 'Em Andamento' para este processo.
        """
        try:
            etapa = ProcessoEtapa.objects.get(processo=obj, status_field='Em Andamento')
            # Agora o Python já sabe o que é 'ProcessoEtapaSimplesSerializer'
            return ProcessoEtapaSimplesSerializer(etapa).data
        except ProcessoEtapa.DoesNotExist:
            return None