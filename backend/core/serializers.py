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
class FotoSerializerField(serializers.Field):
    """Converte BLOB (bytes) em Base64 para exibir no frontend"""
    def to_representation(self, value):
        if value:
            try:
                # Converte o blob (bytes) para Base64
                encoded = base64.b64encode(value).decode('utf-8')
                # Retorna no formato que o <img src=""> entende
                return f"data:image/jpeg;base64,{encoded}"
            except Exception as e:
                print("Erro ao converter imagem:", e)
                return None
        return None

    def to_internal_value(self, data):
        """
        Converte uma imagem em Base64 vinda do frontend para bytes (para salvar no banco)
        """
        try:
            if data.startswith('data:image'):
                header, encoded = data.split(',', 1)
                return base64.b64decode(encoded)
            return None
        except Exception as e:
            print("Erro ao decodificar imagem:", e)
            return None


# ---
# SERIALIZERS DE APOIO
# ---
class AnimaisSerializer(serializers.ModelSerializer):
    foto = FotoSerializerField(required=False)

    class Meta:
        model = Animais
        fields = ['animal_id', 'nome', 'sexo', 'idade', 'tipo', 'foto']

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
# SERIALIZERS PARA A PÁGINA DE ETAPA (DETALHES)
# ---

# Serializer para a tabela 'solicitacao' (read-only)
class SolicitacaoSerializer(serializers.ModelSerializer):
    comprovante_residencia = FotoSerializerField(read_only=True)
    animal = AnimaisSerializer(read_only=True)

    class Meta:
        model = Solicitacao
        fields = ['solicitacao_id', 'animal', 'cpf', 'comprovante_residencia'] 

# Serializer para salvar a Recusa (write-only)
class RecusaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recusa
        fields = ['justificativa', 'processo_etapa']

class EntrevistaSerializer(serializers.ModelSerializer):
    # data_field = serializers.DateField(source='data_') <-- LINHA REMOVIDA
    
    class Meta:
        model = Entrevista
        fields = ['data_field', 'observacoes', 'processo_etapa']

# Serializer para salvar a Visitacao (write-only)
class VisitacaoSerializer(serializers.ModelSerializer):
    # data_field = serializers.DateField(source='data_') <-- LINHA REMOVIDA

    class Meta:
        model = Visitacao
        fields = ['data_field', 'endereco', 'processo_etapa']

# ---
# CORREÇÃO: ReadOnly Serializers para a "Análise Genérica"
# ---
class EntrevistaReadOnlySerializer(serializers.ModelSerializer):
    """
    Serializer de LEITURA para a Entrevista. 
    Usado para mostrar os dados na etapa de Análise.
    """
    # data_field = serializers.DateField(source='data_') <-- LINHA REMOVIDA
    class Meta:
        model = Entrevista
        fields = ['data_field', 'observacoes']

class VisitacaoReadOnlySerializer(serializers.ModelSerializer):
    """
    Serializer de LEITURA para a Visitação.
    Usado para mostrar os dados na etapa de Análise.
    """
    # data_field = serializers.DateField(source='data_') <-- LINHA REMOVIDA
    class Meta:
        model = Visitacao
        fields = ['data_field', 'endereco']


class EtapaRelacaoSimplesSerializer(serializers.ModelSerializer):
    etapa = EtapasSerializer(read_only=True) 
    class Meta:
        model = EtapaRelacao
        fields = ['etapa_relacao_id', 'etapa']

class ValidacaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Validacao
        fields = ['validacao_id', 'descricao']

class EtapaRelacaoDetalhadaSerializer(serializers.ModelSerializer):
    etapa = EtapasSerializer(read_only=True)
    responsavel = TipoUsuarioSerializer(read_only=True)
    proximo = EtapaRelacaoSimplesSerializer(read_only=True) 
    alternativo = EtapaRelacaoSimplesSerializer(read_only=True) 

    class Meta:
        model = EtapaRelacao
        fields = ['etapa_relacao_id', 'etapa', 'responsavel', 'proximo', 'alternativo']


# Serializer principal da página de detalhes da etapa
class ProcessoEtapaDetalhadoSerializer(serializers.ModelSerializer):
    etapa_relacao = EtapaRelacaoDetalhadaSerializer(read_only=True)
    usuario = UsuariosSerializer(read_only=True)
    solicitante = UsuariosSerializer(source='processo.usuario', read_only=True)
    
    # Adiciona os dados dos formulários de etapas anteriores
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
            # Usa o ReadOnlySerializer
            return EntrevistaReadOnlySerializer(entrevista).data
        except Entrevista.DoesNotExist:
            return None
        except Entrevista.MultipleObjectsReturned:
            entrevista = Entrevista.objects.filter(processo_etapa__processo=obj.processo).first()
            return EntrevistaReadOnlySerializer(entrevista).data

    def get_dados_visitacao(self, obj):
        try:
            visitacao = Visitacao.objects.get(processo_etapa__processo=obj.processo)
            # Usa o ReadOnlySerializer
            return VisitacaoReadOnlySerializer(visitacao).data
        except Visitacao.DoesNotExist:
            return None
        except Visitacao.MultipleObjectsReturned:
            visitacao = Visitacao.objects.filter(processo_etapa__processo=obj.processo).first()
            return VisitacaoReadOnlySerializer(visitacao).data


# ---
# SERIALIZERS PARA A PÁGINA "MEUS PROCESSOS"
# ---
class ProcessoEtapaSimplesSerializer(serializers.ModelSerializer):
    etapa_nome = serializers.CharField(source='etapa_relacao.etapa.nome')
    usuario_nome = serializers.CharField(source='usuario.nome', allow_null=True)

    class Meta:
        model = ProcessoEtapa
        fields = ['processo_etapa_id', 'etapa_nome', 'usuario_nome', 'status_field']

class ProcessoListSerializer(serializers.ModelSerializer):
    template_nome = serializers.CharField(source='template.nome')
    etapa_atual = serializers.SerializerMethodField()
    usuario = UsuariosSerializer(read_only=True)

    class Meta:
        model = Processo
        fields = ['processo_id', 'template_nome', 'status_field', 'usuario', 'etapa_atual']

    def get_etapa_atual(self, obj):
        try:
            etapa = ProcessoEtapa.objects.get(processo=obj, status_field='Em Andamento')
            return ProcessoEtapaSimplesSerializer(etapa).data
        except ProcessoEtapa.DoesNotExist:
            return None
        except ProcessoEtapa.MultipleObjectsReturned:
            etapa = ProcessoEtapa.objects.filter(processo=obj, status_field='Em Andamento').latest('processo_etapa_id')
            return ProcessoEtapaSimplesSerializer(etapa).data