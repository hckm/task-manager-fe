const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());

let tasks = [];
let taskId = 1;

// Middleware para verificar API key
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== 'your-api-key-here') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});


app.get('/api/tasks', (req, res) => {
  res.json(tasks);
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  const { titulo, prioridade, responsavel, descricao, prazo, status } = req.body;
  const newTask = {
    id: taskId++,
    titulo,
    prioridade,
    responsavel,
    descricao,
    prazo,
    status: status || 'A Fazer'
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT /api/tasks/:id
app.put('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const task = tasks.find(t => t.id === id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const { titulo, prioridade, responsavel, descricao, prazo, status } = req.body;
  task.titulo = titulo || task.titulo;
  task.prioridade = prioridade || task.prioridade;
  task.responsavel = responsavel || task.responsavel;
  task.descricao = descricao || task.descricao;
  task.prazo = prazo || task.prazo;
  task.status = status || task.status;
  res.json(task);
});

// DELETE /api/tasks/:id (opcional)
app.delete('/api/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`API rodando em http://localhost:${PORT}`);
});