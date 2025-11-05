from django.contrib import admin
from django.urls import path
# Importa as views do seu app 'core'
from core.views import (
    AnimaisListView, 
    EtapasListView, 
    TipoUsuarioListView, 
    TemplateCreateView
)

urlpatterns = [
    # URL do painel de admin
    path('admin/', admin.site.urls),
    
    # ---
    # API DE ANIMAIS (da primeira parte)
    # ---
    # GET /api/animais/
    path('api/animais/', AnimaisListView.as_view(), name='animais-list'),

    # ---
    # NOVAS APIs PARA O CRIADOR DE TEMPLATES
    # ---
    
    # GET /api/etapas/
    # (Lista as etapas, ex: Solicitação, Análise...)
    path('api/etapas/', EtapasListView.as_view(), name='etapas-list'),
    
    # GET /api/tipos-usuario/
    # (Lista os responsáveis, ex: Admin, Adotante...)
    path('api/tipos-usuario/', TipoUsuarioListView.as_view(), name='tipos-usuario-list'),
    
    # POST /api/templates/create/
    # (Endpoint que recebe o JSON e chama a procedure)
    path('api/templates/create/', TemplateCreateView.as_view(), name='template-create'),
]