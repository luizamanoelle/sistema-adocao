from django.contrib import admin
from django.urls import path

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
    ProcessoConcluirView,
    EntrevistaSubmitView, # <-- IMPORTAR
    VisitacaoSubmitView  # <-- IMPORTAR
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
    path('api/templates/', TemplateListView.as_view(), name='template-list'),

    path('api/login/', LoginView.as_view(), name='login'),

    path('api/processos/start/', ProcessoStartView.as_view(), name='processo-start'),

    path('api/processo/etapa/<int:pk>/', ProcessoEtapaDetailView.as_view(), name='processo-etapa-detail'),

    # API de Submissão de Formulário (POST)
    path('api/etapa/solicitacao/submit/', SolicitacaoSubmitView.as_view(), name='solicitacao-submit'),

    path('api/processos/meus/', ProcessoListView.as_view(), name='processo-list'),

    path('api/etapa/encaminhar/', EncaminharEtapaView.as_view(), name='etapa-encaminhar'),

    path('api/etapa/recusa/submit/', RecusaSubmitView.as_view(), name='recusa-submit'),

    path('api/processo/concluir/', ProcessoConcluirView.as_view(), name='processo-concluir'),

    # --- ADICIONAR AS NOVAS ROTAS ---
    path('api/etapa/entrevista/submit/', EntrevistaSubmitView.as_view(), name='entrevista-submit'),
    path('api/etapa/visitacao/submit/', VisitacaoSubmitView.as_view(), name='visitacao-submit'),
]