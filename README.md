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

### Backend 
- Django + Python
---
### Banco de dados
- MySQL 

##  Como Rodar o Projeto

1. Clone este repositório:
   ```bash
   git clone https://github.com/SEU_USUARIO/sistema-adocao.git
   cd sistema-adocao
### Fronted
1. Entra na pasta frontend:
   ```bash
   cd frontend

2. Instale as dependências:
   ```bash
   npm install
3. Execute o projeto:
   ```bash
   npm run dev

### Backend
1. entrar na pasta do backend
   ```bash
   cd backend

2. criar e ativar o ambiente virtual (na IDE)
   ```bash
   python -m venv venv

3. criar e ativar o ambiente virtual (no terminal dentro da pasta sistema-adocao)
   ```bash
   venv\Scripts\activate     # (Windows)
   source venv/bin/activate  # (Linux/Mac)

4. instalar dependências:
   ```bash
   pip install -r requirements.txt

5. rodar o servidor Django
   ```bash
   python manage.py runserver


OBS: TALVEZ PRECISE INSTALAR ISSO AQUI TAMBÉM
```bash
   pip install cryptography
```
OBS: DENTRO DA PASTA BACKEND CRIE O ARQUIVO .ENV E COLE ISSO:
```bash
DB_NAME=petflow
DB_USER=root
DB_PASSWORD=minha_senha_segura
DB_HOST=localhost
DB_PORT=3306
```
PS: SE DER ERRO NO ENV INSIRA MANUALMENTE NO SETTINGS
```bash
\sistema-adocao\backend\petflow\settings.py