from rest_framework.generics import ListAPIView
from .models import Animais
from .serializers import AnimaisSerializer

class AnimaisListView(ListAPIView):
    queryset = Animais.objects.all() # Pega todos os Animais do banco
    serializer_class = AnimaisSerializer