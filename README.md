#  Sistema de Adoção - Workflow de Aprovação

Este projeto foi desenvolvido para a disciplina **Projeto e Gerência de Banco de Dados (2025/2)**  
O objetivo é criar um **sistema de workflow** que gerencie o processo de **adoção de animais**, controlando as etapas desde a solicitação até a aprovação final.

---

##  Objetivo do Sistema
O sistema permite:
- Criar **templates de processos** (modelos de fluxo de adoção)
- Executar **processos reais** com base nesses templates
- Controlar o **andamento das etapas** (quem faz o quê)
- Fazer **consultas** e **filtros** por status, adotante, tipo de animal, etc.

---

##  Tecnologias Utilizadas
### Frontend
- React + Vite + TailwindCSS + DaisyUI (JS)

### Backend ?
- Django + Python
---

##  Como Rodar o Projeto

1. Clone este repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/sistema-adocao.git
   cd sistema-adocao
2. Instale as dependências:
   ```bash
   npm install
3. Execute o projeto:
   ```bash
   npm run dev

  ## Frontend
1. Baixar o node: https://nodejs.org/pt
# entrar na pasta do frontend
cd frontend

# instalar dependências
npm install

# rodar o servidor
npm run dev

 ##  Backend
 # entrar na pasta do backend
cd backend

# criar e ativar o ambiente virtual
```bash
python -m venv venv
venv\Scripts\activate     # (Windows)
# ou
source venv/bin/activate  # (Linux/Mac)

# instalar dependências
pip install -r requirements.txt

# rodar o servidor Django
python manage.py runserver


OBS: DENTRO DA PASTA BACKEND CRIE O ARQUIVO .ENV E COLE ISSO:

DB_NAME=sistema_adocao
DB_USER=root
DB_PASSWORD=minha_senha_segura
DB_HOST=localhost
DB_PORT=3306
