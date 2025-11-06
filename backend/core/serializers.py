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


class FotoSerializerField(Field):
    """
    Um SerializerField customizado para converter o BLOB (bytes) do banco
    para uma string Base64 que o <img src=""> do frontend entende.
    """
    def to_representation(self, value):
        if value:
            # Assume que o mime type é png, mas você pode ajustar
            # O formato é: data:<mime-type>;base64,<dados-base64>
            mime_type = "image/png" # Ou jpeg, etc.
            return f"data:{mime_type};base64,{base64.b64encode(value).decode('utf-8')}"
        return None

# SERIALIZERS PARA CADA MODELO
class AnimaisSerializer(serializers.ModelSerializer):
    """
    Serializer para Animais.
    Ele substitui o campo 'foto' padrão pelo nosso campo customizado
    que faz a conversão para Base64.
    """
    # Substitui o campo 'foto' padrão
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


class TemplateSerializer(serializers.ModelSerializer):
    """inclui um campo 'responsavel_primeira_etapa' que
    busca no banco qual o tipo de usuário pode iniciar este template.
    """
    responsavel_primeira_etapa = serializers.SerializerMethodField()

    class Meta:
        model = Template
        # Adiciona o novo campo ao 'fields'
        fields = ['template_id', 'nome', 'responsavel_primeira_etapa']

    def get_responsavel_primeira_etapa(self, obj):
        """
        Esta função é chamada para cada template.
        Ela busca a "primeira etapa" (baseado na sua trigger, é a MAX(id))
        e retorna o ID do responsável por ela.
        """
        try:
            # Lógica baseada em tg_Processo_criacaoProcesso_Etapa.sql
            # Pega a Etapa_Relacao com o MAIOR ID para este template
            primeira_etapa = EtapaRelacao.objects.filter(
                template=obj
            ).latest('etapa_relacao_id')
            
            # Retorna o ID do tipo de usuário (ex: 1, 2, ou 3)
            return primeira_etapa.responsavel.tipo_id
        except EtapaRelacao.DoesNotExist:
            return None

# (Opcional) Serializers para os outros modelos, caso precise listá-los
class EntrevistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entrevista
        fields = '__all__'

class EtapaRelacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtapaRelacao
        fields = '__all__'

class ProcessoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Processo
        fields = '__all__'

class ProcessoEtapaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProcessoEtapa
        fields = '__all__'

class RecusaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recusa
        fields = '__all__'

class SolicitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitacao
        fields = '__all__'

class UsuariosSerializer(serializers.ModelSerializer):
    """
    Serializer para Usuarios, usado no Login.
    Importante: não inclui a senha no retorno.
    """
    # Pega o 'tipo_usuario' (ID) e 'tipo_usuario.categoria' (Nome)
    tipo_usuario_detalhes = TipoUsuarioSerializer(source='tipo_usuario', read_only=True)
    
    class Meta:
        model = Usuarios
        # Retorna apenas campos seguros
        fields = ['usuario_id', 'nome', 'email', 'tipo_usuario', 'tipo_usuario_detalhes']

class ValidacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacao
        fields = '__all__'

class VisitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitacao
        fields = '__all__'