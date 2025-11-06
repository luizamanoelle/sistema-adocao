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

]