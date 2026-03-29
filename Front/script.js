// Adaptação JS do Lucas
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
  constructor(titulo, prioridade, responsavel) {
    this.#titulo = titulo;
    this.prioridade = prioridade;
    this.responsavel = responsavel;
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
}

class TaskFlowGerenciador {
  constructor() {
    this.tarefas = [];
  }

  adicionarTarefa(tarefa) {
    this.tarefas.push(tarefa);
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

document.getElementById("taskForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value;
  const resp = document.getElementById("responsavel").value;
  const prio = document.getElementById("prioridade").value;

  const usuario = new Usuario(resp);
  const novaTarefa = new Tarefa(titulo, prio, usuario);

  app.adicionarTarefa(novaTarefa);

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

  // Renderiza a lista de tarefas
  const lista = document.getElementById("listaTarefas");
  lista.innerHTML = "";

  app.tarefas.forEach((t, i) => {
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
              <small class="text-muted">Responsável: ${t.responsavel.getNome()} | Prioridade: ${t.prioridade}</small>
              
              <div class="mt-3">
                  <select class="form-select form-select-sm w-auto" onchange="mudarStatus(${i}, this.value)">
                      <option value="A Fazer" ${status === "A Fazer" ? "selected" : ""}>A Fazer</option>
                      <option value="Em Andamento" ${status === "Em Andamento" ? "selected" : ""}>Em Andamento</option>
                      <option value="Concluido" ${status === "Concluido" ? "selected" : ""}>Concluído</option>
                  </select>
              </div>
          </div>
      </div>`;
  });
}

window.mudarStatus = function (id, novoStatus) {
  app.tarefas[id].setStatus(novoStatus);
  atualizarUI();
};
