from rest_framework import serializers
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

# Serializer principal para a sua página de pets
class AnimaisSerializer(serializers.ModelSerializer):
    class Meta:
        model = Animais
        fields = '__all__'
        # '__all__' é um atalho para incluir todos os campos:
        # [
        #   'animal_id', 
        #   'nome', 
        #   'sexo', 
        #   'idade', 
        #   'foto', 
        #   'tipo'
        # ]


# --- Serializers para os outros modelos do seu workflow ---

class UsuariosSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuarios
        # Importante! Nunca exponha o campo 'senha' em uma API.
        fields = [
            'usuario_id', 
            'nome', 
            'idade', 
            'email', 
            'tipo_usuario'
        ]

class TipoUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = TipoUsuario
        fields = '__all__'

class EtapasSerializer(serializers.ModelSerializer):
    class Meta:
        model = Etapas
        fields = '__all__'

class TemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Template
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

class SolicitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Solicitacao
        fields = '__all__'

class EntrevistaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Entrevista
        fields = '__all__'

class RecusaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recusa
        fields = '__all__'

class ValidacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacao
        fields = '__all__'

class VisitacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitacao
        fields = '__all__'
