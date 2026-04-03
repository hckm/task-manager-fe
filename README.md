# task-manager
Projeto BootCampo Desenvolvimento e Projeto de Sistemas

## Como executar

### Backend (API)
1. Navegue para a pasta `api`
2. Instale as dependências: `npm install`
3. Execute: `npm start`
4. A API estará rodando em http://localhost:8080

### Frontend
1. Navegue para a pasta `Front`
2. Execute um servidor HTTP, por exemplo: `python -m http.server 8000`
3. Abra http://localhost:8000 no navegador

## Funcionalidades
- Adicionar tarefas com título, descrição, prioridade, responsável e prazo
- Visualizar tarefas em cards coloridos por status
- Alterar status das tarefas
- Filtros por responsável e status
- Dashboard com estatísticas e progresso

## API Endpoints
- GET /api/tasks - Listar tarefas
- POST /api/tasks - Criar tarefa
- PUT /api/tasks/:id - Atualizar tarefa
- DELETE /api/tasks/:id - Deletar tarefa

Autenticação: Header `X-API-Key` com valor `your-api-key-here`
