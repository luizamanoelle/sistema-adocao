from django.contrib import admin
# Importa todos os modelos que você criou no models.py
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

# "Registra" cada modelo no site de administração
# Você pode registrar todos ou apenas os que quiser gerenciar
admin.site.register(Animais)
admin.site.register(Entrevista)
admin.site.register(EtapaRelacao)
admin.site.register(Etapas)
admin.site.register(Processo)
admin.site.register(ProcessoEtapa)
admin.site.register(Recusa)
admin.site.register(Solicitacao)
admin.site.register(Template)
admin.site.register(TipoUsuario)
admin.site.register(Usuarios)
admin.site.register(Validacao)
admin.site.register(Visitacao)
