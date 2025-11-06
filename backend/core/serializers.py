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
    Converte BLOB (bytes) do banco para uma string Base64 
    que o <img src=""> ou <a href=""> do frontend entende.
    """
    def to_representation(self, value):
        if value:
            # Tenta decodificar como imagem. Se falhar, assume que é PDF.
            try:
                decoded_value = base64.b64encode(value).decode('utf-8')
                # Tenta PNG
                mime_type = "image/png"
                if not decoded_value.startswith('iVBOR'):
                    # Tenta JPG
                    if decoded_value.startswith('/9j/'):
                        mime_type = "image/jpeg"
                    else:
                        # Assume PDF se não for imagem conhecida
                        # (O frontend lidará com 'data:application/pdf;base64,...')
                        mime_type = "application/pdf"
                
                return f"data:{mime_type};base64,{decoded_value}"
            except Exception:
                # Fallback para PDF se a decodificação falhar
                try:
                    decoded_value = base64.b64encode(value).decode('utf-8')
                    return f"data:application/pdf;base64,{decoded_value}"
                except Exception:
                    return None
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
# SERIALIZERS PARA A PÁGINA DE ETAPA (DETALHES)
# ---

# 1. ATUALIZADO: SolicitacaoSerializer agora é read-only e mais detalhado
class SolicitacaoSerializer(serializers.ModelSerializer):
    """
    Serializer para a tabela 'solicitacao'.
    Usado para mostrar os dados na Análise.
    """
    comprovante_residencia = FotoSerializerField(read_only=True)
    animal = AnimaisSerializer(read_only=True)

    class Meta:
        model = Solicitacao
        fields = ['solicitacao_id', 'animal', 'cpf', 'comprovante_residencia'] 


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


# 2. ATUALIZADO: ProcessoEtapaDetalhadoSerializer (causa do bug de "loading")
class ProcessoEtapaDetalhadoSerializer(serializers.ModelSerializer):
    """
    O serializer principal da página.
    Ele puxa o ProcessoEtapa e todos os seus detalhes aninhados.
    """
    etapa_relacao = EtapaRelacaoDetalhadaSerializer(read_only=True)
    usuario = UsuariosSerializer(read_only=True) # <-- O dono ATUAL da etapa (ex: Admin)
    
    # Adiciona o usuário que CRIOU o processo
    solicitante = UsuariosSerializer(source='processo.usuario', read_only=True)
    
    # Adiciona os dados do formulário de solicitação
    dados_solicitacao = serializers.SerializerMethodField()

    class Meta:
        model = ProcessoEtapa
        fields = [
            'processo_etapa_id', 
            'processo', 
            'status_field', 
            'etapa_relacao', 
            'usuario', 
            'solicitante', # <-- Adicionado
            'dados_solicitacao'
        ]

    def get_dados_solicitacao(self, obj):
        """
        Busca os dados da 'solicitacao' associados a este processo.
        """
        try:
            # Encontra a solicitação que pertence ao mesmo processo
            solicitacao = Solicitacao.objects.get(processo_etapa__processo=obj.processo)
            return SolicitacaoSerializer(solicitacao).data
        except Solicitacao.DoesNotExist:
            return None # Processo não tem solicitação (ou lógica falhou)
        except Solicitacao.MultipleObjectsReturned:
            solicitacao = Solicitacao.objects.filter(processo_etapa__processo=obj.processo).first()
            return SolicitacaoSerializer(solicitacao).data


# ---
# SERIALIZERS PARA A PÁGINA "MEUS PROCESSOS" (ORDEM CORRIGIDA)
# ---

# 3. CORREÇÃO DE ORDEM: ProcessoEtapaSimplesSerializer (DEFINIDO PRIMEIRO)
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


# 4. CORREÇÃO DE ORDEM: ProcessoListSerializer (DEFINIDO DEPOIS)
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
        except ProcessoEtapa.MultipleObjectsReturned:
            # Caso raro de duas etapas "Em Andamento"
            etapa = ProcessoEtapa.objects.filter(processo=obj, status_field='Em Andamento').latest('processo_etapa_id')
            return ProcessoEtapaSimplesSerializer(etapa).data