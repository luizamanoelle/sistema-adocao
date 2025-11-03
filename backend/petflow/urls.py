from django.contrib import admin
from django.urls import path, include
from core.views import AnimaisListView # <-- Importe sua view

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Nossa nova URL da API
    path('api/animais/', AnimaisListView.as_view(), name='animais-list'),
]