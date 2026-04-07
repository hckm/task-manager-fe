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
  constructor(titulo, prioridade, responsavel, descricao = "", idBackend = null) {
    this.#titulo = titulo;
    this.prioridade = prioridade;
    this.responsavel = responsavel;
    this.descricao = descricao;
    this.idBackend = idBackend;
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
// const API_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "https://task-manager-api-g9-cef2b0a6ceg6b8dr.brazilsouth-01.azurewebsites.net"
const TAREFAS_ENDPOINT = `${API_BASE_URL}/api/tarefas`;
const RESPONSAVEIS_ENDPOINT = `${API_BASE_URL}/api/responsaveis`;
const STATUS_INICIAL_API = "AFAZER";

function montarErroBackend(rawBody, status) {
  if (!rawBody) {
    return `Falha ao criar tarefa (${status})`;
  }

  try {
    const parsed = JSON.parse(rawBody);
    const primeiraNotificacao = parsed?.notifications?.[0]?.message;
    const traceId = parsed?.traceId;

    if (primeiraNotificacao && traceId) {
      return `${primeiraNotificacao} (traceId: ${traceId})`;
    }

    if (primeiraNotificacao) {
      return primeiraNotificacao;
    }

    return rawBody;
  } catch {
    return rawBody;
  }
}

async function carregarResponsaveisNoSelect() {
  const select = document.getElementById("responsavel");

  try {
    const response = await fetch(RESPONSAVEIS_ENDPOINT);

    if (!response.ok) {
      throw new Error(`Falha ao buscar responsáveis (${response.status})`);
    }

    const data = await response.json();
    const lista = Array.isArray(data?.content) ? data.content : [];

    select.innerHTML = '<option value="" disabled selected>Escolher</option>';

    lista.forEach((item) => {
      const option = document.createElement("option");
      option.value = String(item.id);
      option.textContent = item.responsavel;
      select.appendChild(option);
    });
  } catch (error) {
    console.error("Erro ao carregar responsáveis:", error);
    select.innerHTML =
      '<option value="" disabled selected>Não foi possível carregar</option>';
  }
}

async function criarTarefaNoBackend(payload) {
  const response = await fetch(TAREFAS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(montarErroBackend(errorBody, response.status));
  }

  const rawBody = await response.text();
  return rawBody ? JSON.parse(rawBody) : null;
}

document.getElementById("taskForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value;
  const descricao = document.getElementById("descricao").value;
  const respSelect = document.getElementById("responsavel");
  const responsavelId = Number(respSelect.value);
  const responsavelNome = respSelect.options[respSelect.selectedIndex]?.text || "";
  const prio = document.getElementById("prioridade").value;
  const statusAtividade = STATUS_INICIAL_API;

  if (!Number.isSafeInteger(responsavelId)) {
    alert("Selecione um responsável válido.");
    return;
  }

  const payload = {
    titulo,
    descricao,
    responsavelId,
    prioridade: prio,
    statusAtividade,
  };

  const submitBtn = this.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.innerText = "Salvando...";

  try {
    const tarefaCriada = await criarTarefaNoBackend(payload);

    const usuario = new Usuario(responsavelNome);
    const novaTarefa = new Tarefa(
      titulo,
      prio,
      usuario,
      descricao,
      tarefaCriada?.id ?? null
    );

    if (tarefaCriada?.statusAtividade) {
      novaTarefa.setStatus(tarefaCriada.statusAtividade);
    }

    app.adicionarTarefa(novaTarefa);
    this.reset();
    atualizarUI();
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    alert(`Erro ao criar tarefa no backend: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Adicionar Tarefa";
  }
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
              ${t.descricao ? `<p class="mb-0 mt-2 small text-secondary">${t.descricao}</p>` : ""}
              
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

carregarResponsaveisNoSelect();
