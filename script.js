// Adaptação JS do Lucas
const API_BASE = 'http://localhost:8080/api';
const API_KEY = 'your-api-key-here'; // Substitua pela sua chave da API

class Usuario {
  #nome;
  constructor(nome) {
    this.#nome = nome;
  }
  getNome() {
    return this.#nome;
  }
}

class Tarefa {
  #titulo;
  #status;
  constructor(titulo, prioridade, responsavel, descricao, prazo, id = null) {
    this.id = id;
    this.#titulo = titulo;
    this.prioridade = prioridade;
    this.responsavel = responsavel;
    this.descricao = descricao;
    this.prazo = prazo;
    this.#status = "A Fazer";
  }
  getTitulo() {
    return this.#titulo;
  }
  getStatus() {
    return this.#status;
  }
  setStatus(novoStatus) {
    this.#status = novoStatus;
  }
  getDescricao() {
    return this.descricao;
  }
  getPrazo() {
    return this.prazo;
  }
  toJSON() {
    return {
      titulo: this.#titulo,
      prioridade: this.prioridade,
      responsavel: this.responsavel.getNome(),
      descricao: this.descricao,
      prazo: this.prazo,
      status: this.#status
    };
  }
}

class TaskFlowGerenciador {
  constructor() {
    this.tarefas = [];
  }

  // Carrega tarefas da API
  async carregarTarefas() {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'GET',
        headers: {
          'x-api-key': API_KEY
        }
      });
      if (!response.ok) throw new Error(`Erro ao carregar tarefas: ${response.status}`);
      const dados = await response.json();
      this.tarefas = dados.map(d => 
        new Tarefa(d.titulo, d.prioridade, new Usuario(d.responsavel), d.descricao, d.prazo, d.id)
      );
    } catch (erro) {
      console.error('Erro ao carregar tarefas:', erro);
    }
  }

  // Adiciona tarefa via API
  async adicionarTarefa(tarefa) {
    try {
      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(tarefa.toJSON())
      });
      if (!response.ok) throw new Error(`Erro ao adicionar tarefa: ${response.status}`);
      const novaTarefa = await response.json();
      tarefa.id = novaTarefa.id;
      this.tarefas.push(tarefa);
    } catch (erro) {
      console.error('Erro ao adicionar tarefa:', erro);
    }
  }

  // Atualiza tarefa via API
  async atualizarTarefa(id, novoStatus) {
    try {
      const tarefa = this.tarefas.find(t => t.id === id);
      if (!tarefa) return;
      
      const dados = tarefa.toJSON();
      dados.status = novoStatus;
      
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(dados)
      });
      if (!response.ok) throw new Error(`Erro ao atualizar tarefa: ${response.status}`);
      tarefa.setStatus(novoStatus);
    } catch (erro) {
      console.error('Erro ao atualizar tarefa:', erro);
    }
  }

  // Deleta tarefa via API
  async deletarTarefa(id) {
    try {
      const response = await fetch(`${API_BASE}/tasks/${id}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': API_KEY
        }
      });
      if (!response.ok) throw new Error(`Erro ao deletar tarefa: ${response.status}`);
      this.tarefas = this.tarefas.filter(t => t.id !== id);
    } catch (erro) {
      console.error('Erro ao deletar tarefa:', erro);
    }
  }

  // Cálculo Adaptado do Lucas
  calcularProgresso() {
    const total = this.tarefas.length;
    let concluidas = 0;
    let aFazer = 0;
    let andamento = 0;

    this.tarefas.forEach((t) => {
      const status = t.getStatus();
      if (status === "Concluido") concluidas++;
      else if (status === "A Fazer") aFazer++;
      else if (status === "Em Andamento") andamento++;
    });

    const percentual = total === 0 ? 0 : Math.round((concluidas / total) * 100);

    return { total, concluidas, aFazer, andamento, percentual };
  }
}

// HTML e CSS interligado ao JS
const app = new TaskFlowGerenciador();

// Carregar tarefas ao iniciar
document.addEventListener('DOMContentLoaded', async () => {
  await app.carregarTarefas();
  atualizarUI();
});

document.getElementById("taskForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value;
  const resp = document.getElementById("responsavel").value;
  const prio = document.getElementById("prioridade").value;
  const descricao = document.getElementById("descricao").value;
  const prazo = document.getElementById("prazo").value;

  const usuario = new Usuario(resp);
  const novaTarefa = new Tarefa(titulo, prio, usuario, descricao, prazo);

  await app.adicionarTarefa(novaTarefa);

  this.reset();
  atualizarUI();
});

function atualizarUI() {
  const metricas = app.calcularProgresso();

  // Cards
  document.getElementById("totalTxt").innerText = metricas.total;
  document.getElementById("afazerTxt").innerText = metricas.aFazer;
  document.getElementById("andamentoTxt").innerText = metricas.andamento;
  document.getElementById("concluidasTxt").innerText = metricas.concluidas;

  // Barra de progresso geral (atualizar)
  document.getElementById("percentual-geral").innerText =
    `${metricas.percentual}%`;
  document.getElementById("progress-bar-geral").style.width =
    `${metricas.percentual}%`;

  // Atualizar filtro de responsáveis
  const filtroResp = document.getElementById("filtro-responsavel");
  const responsaveis = [...new Set(app.tarefas.map(t => t.responsavel.getNome()))];
  filtroResp.innerHTML = '<option value="">Todos os responsáveis</option>';
  responsaveis.forEach(resp => {
    filtroResp.innerHTML += `<option value="${resp}">${resp}</option>`;
  });

  // Renderiza a lista de tarefas
  const lista = document.getElementById("listaTarefas");
  lista.innerHTML = "";

  const filtroRespValue = document.getElementById("filtro-responsavel").value;
  const filtroStatus = document.getElementById("filtro-status").value;

  const tarefasFiltradas = app.tarefas.filter(t => {
    const matchResp = !filtroRespValue || t.responsavel.getNome() === filtroRespValue;
    const matchStatus = !filtroStatus || t.getStatus() === filtroStatus;
    return matchResp && matchStatus;
  });

  tarefasFiltradas.forEach((t) => {
    const status = t.getStatus();

    // Cores do CSS interligada ao bloco de tarefas
    let classeCor = "";
    if (status === "A Fazer") classeCor = "task-afazer";
    else if (status === "Em Andamento") classeCor = "task-andamento";
    else if (status === "Concluido") classeCor = "task-concluida";
    // Card da tarefa
    lista.innerHTML += `
      <div class="col-12">
          <div class="task-card card p-4 ${classeCor} shadow-sm">
              <h5 class="fw-bold">${t.getTitulo()}</h5>
              <small class="text-muted">Responsável: ${t.responsavel.getNome()} | Prioridade: ${t.prioridade}</medium>
              
              <div class="mt-3">
                  <select class="form-select form-select-sm w-auto" onchange="mudarStatus(${t.id}, this.value)">
                      <option value="A Fazer" ${status === "A Fazer" ? "selected" : ""}>A Fazer</option>
                      <option value="Em Andamento" ${status === "Em Andamento" ? "selected" : ""}>Em Andamento</option>
                      <option value="Concluido" ${status === "Concluido" ? "selected" : ""}>Concluído</option>
                  </select>
              </div>
          </div>
      </div>`;
  });
}

window.mudarStatus = async function (id, novoStatus) {
  await app.atualizarTarefa(id, novoStatus);
  atualizarUI();
};

function filtrarTarefas() {
  atualizarUI();
}

function limparFiltros() {
  document.getElementById("filtro-responsavel").value = "";
  document.getElementById("filtro-status").value = "";
  atualizarUI();
}
