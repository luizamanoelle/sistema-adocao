from django.contrib import admin
from django.urls import path
from django.conf import settings

# Importa as views de core
from core.views import (
    AnimaisListView, 
    EtapasListView, 
    TipoUsuarioListView, 
    TemplateCreateView,
    TemplateListView,
    LoginView,
    ProcessoStartView,
    ProcessoEtapaDetailView,
    SolicitacaoSubmitView,
    ProcessoListView,
    EncaminharEtapaView,
    RecusaSubmitView,
    EntrevistaSubmitView, 
    VisitacaoSubmitView,  
)

urlpatterns = [
    # URL do painel de admin
    path('admin/', admin.site.urls),
 
    # GET /api/animais/
    path('api/animais/', AnimaisListView.as_view(), name='animais-list'),

    # GET /api/etapas/
    # (Lista as etapas, ex: Solicitação, Análise...)
    path('api/etapas/', EtapasListView.as_view(), name='etapas-list'),
    
    # GET /api/tipos-usuario/
    # (Lista os responsáveis, ex: Admin, Adotante...)
    path('api/tipos-usuario/', TipoUsuarioListView.as_view(), name='tipos-usuario-list'),
    
    # POST /api/templates/create/
    # (Endpoint que recebe o JSON e chama a procedure)
    path('api/templates/create/', TemplateCreateView.as_view(), name='template-create'),

    # GET /api/templates/
    # Retorna lista de templates
    path('api/templates/', TemplateListView.as_view(), name='template-list'),

    # POST /api/login/
    # Faz o Login
    path('api/login/', LoginView.as_view(), name='login'),

    # POST /api/processos/start/
    # Inicia um novo processo com base em um template
    path('api/processos/start/', ProcessoStartView.as_view(), name='processo-start'),

    # GET /api/processo/etapa/id
    # Retorna detalhes de uma etapa especifica (usado ao abrir um novo processo)
    path('api/processo/etapa/<int:pk>/', ProcessoEtapaDetailView.as_view(), name='processo-etapa-detail'),

    # POST /api/etapa/solicitacao/submit/
    # Submete um formulário
    path('api/etapa/solicitacao/submit/', SolicitacaoSubmitView.as_view(), name='solicitacao-submit'),

    # GET /api/processos/meu/
    # Lista de todos os processos iniciados ou atribuidos ao usuario
    path('api/processos/meus/', ProcessoListView.as_view(), name='processo-list'),

    # POST api/etapa/encaminhar
    # Avança o processo pra proxima etapa (usado nos botões)
    path('api/etapa/encaminhar/', EncaminharEtapaView.as_view(), name='etapa-encaminhar'),

    #POST /api/etapa/recusa/submit/
    # Submete a recusa
    path('api/etapa/recusa/submit/', RecusaSubmitView.as_view(), name='recusa-submit'),

    # POST /api/etapa/entrevista/submit/
    # submete os dados de entrevista
    path('api/etapa/entrevista/submit/', EntrevistaSubmitView.as_view(), name='entrevista-submit'),
    
    # POST /api/etapa/visitacao/submit
    # submete os dados de visitacao
    path('api/etapa/visitacao/submit/', VisitacaoSubmitView.as_view(), name='visitacao-submit'),
    
]
