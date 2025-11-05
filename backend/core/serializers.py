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

# ---
# SERIALIZERS PARA CADA MODELO
# ---

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
    class Meta:
        model = Template
        fields = '__all__'


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
    class Meta:
        model = Usuarios
        fields = '__all__'

class ValidacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacao
        fields = '__all__'

class VisitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitacao
        fields = '__all__'