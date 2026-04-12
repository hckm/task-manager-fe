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
  constructor(titulo, prioridade, responsavel, descricao = "", prazo = "", idBackend = null) {
    this.#titulo = titulo;
    this.prioridade = prioridade;
    this.responsavel = responsavel;
    this.descricao = descricao;
    this.prazo = prazo;
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
// ============================================================
// Constantes
// ============================================================
const app = new TaskFlowGerenciador();
// const API_BASE_URL = "http://localhost:8080";
const API_BASE_URL = "https://task-manager-api-g9-cef2b0a6ceg6b8dr.brazilsouth-01.azurewebsites.net"
const TAREFAS_ENDPOINT = `${API_BASE_URL}/api/tarefas`;
const FILTRAR_ENDPOINT = `${API_BASE_URL}/api/tarefas/filtrar`;
const RESPONSAVEIS_ENDPOINT = `${API_BASE_URL}/api/responsaveis`;
const STATUS_INICIAL_API = "AFAZER";

// ============================================================
// Estado de paginação
// ============================================================
let tamanhoPagina  = 5;   // itens por página (alterável pelo usuário)
let paginaAtual    = 0;
let totalPaginas   = 0;
let totalElementos = 0;

// Mapa de normalização: valor da API → valor interno
const STATUS_NORMALIZADO = {
  AFAZER: "A Fazer",
  A_FAZER: "A Fazer",
  EMANDAMENTO: "Em Andamento",
  EM_ANDAMENTO: "Em Andamento",
  CONCLUIDO: "Concluido",
  "CONCLU\u00cdDO": "Concluido",
};

// Mapa reverso: valor interno → nome exato do enum StatusAtividade no backend
const STATUS_PARA_API = {
  "A Fazer":      "AFAZER",
  "Em Andamento": "EmAndamento",
  "Concluido":    "Concluido",
};

// Mapa de exibição: enum Prioridade → label amigável
const PRIORIDADE_LABEL = {
  ALTA:  "Alta",
  MEDIO: "Médio",
  BAIXO: "Baixo",
};

// ============================================================
// Helpers de data
// ============================================================

/** Retorna a data de hoje no formato ISO (yyyy-MM-dd) — valor do input[type=date] */
function hojeISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Converte yyyy-MM-dd → dd/MM/yyyy (formato esperado pela API) */
function isoParaAPI(isoDate) {
  if (!isoDate) return "";
  const [yyyy, mm, dd] = isoDate.split("-");
  return `${dd}/${mm}/${yyyy}`;
}

/** Converte dd/MM/yyyy → yyyy-MM-dd (para popular input[type=date]) */
function apiParaISO(apiDate) {
  if (!apiDate) return "";
  const [dd, mm, yyyy] = apiDate.split("/");
  return `${yyyy}-${mm}-${dd}`;
}

/** Retorna a data de amanhã no formato ISO (yyyy-MM-dd) */
function amanhaISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Inicializa os filtros de data:
 *  - Data inicial = hoje (data corrente)
 *  - Data final   = amanhã
 */
function inicializarFiltrosData() {
  const inputInicial = document.getElementById("filtro-data-inicial");
  const inputFinal = document.getElementById("filtro-data-final");
  if (inputInicial) inputInicial.value = hojeISO();
  if (inputFinal) inputFinal.value = amanhaISO();
}

// ============================================================
// Erro de backend
// ============================================================
function montarErroBackend(rawBody, status) {
  if (!rawBody) return `Falha ao criar tarefa (${status})`;
  try {
    const parsed = JSON.parse(rawBody);
    const primeiraNotificacao = parsed?.notifications?.[0]?.message;
    const traceId = parsed?.traceId;
    if (primeiraNotificacao && traceId) return `${primeiraNotificacao} (traceId: ${traceId})`;
    if (primeiraNotificacao) return primeiraNotificacao;
    return rawBody;
  } catch {
    return rawBody;
  }
}

// ============================================================
// Busca de tarefas no backend (filtro por data, responsável e status)
// ============================================================
async function buscarTarefasDoBackend(pagina = 0) {
  const dataInicial = document.getElementById("filtro-data-inicial")?.value || "";
  const dataFinal   = document.getElementById("filtro-data-final")?.value   || "";

  if (!dataInicial || !dataFinal) {
    renderizarListaVazia("Selecione um período para buscar as tarefas.");
    return;
  }

  // Monta os query params — dataInicial/dataFinal em yyyy-MM-dd (input[type=date])
  const params = new URLSearchParams({
    dataInicio: dataInicial,
    dataFim:    dataFinal,
    page:       pagina,
    size:       tamanhoPagina,
  });

  // Responsável — valor do select é o ID numérico
  const responsavelId = document.getElementById("filtro-responsavel")?.value || "";
  if (responsavelId) params.append("responsavelId", responsavelId);

  // Status — converte o valor de exibição para o enum do backend
  const statusDisplay = document.getElementById("filtro-status")?.value || "";
  if (statusDisplay) {
    const statusAPI = STATUS_PARA_API[statusDisplay] ?? statusDisplay;
    params.append("statusAtividade", statusAPI);
  }

  const url = `${FILTRAR_ENDPOINT}?${params.toString()}`;

  mostrarCarregando();

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro ao buscar tarefas (${response.status})`);
    }

    const data = await response.json();
    const pageData = data?.content;
    const itens = Array.isArray(pageData?.content)
      ? pageData.content
      : [];

    // Armazena metadados de paginação vindos do Spring Page
    paginaAtual    = pageData?.number       ?? 0;
    totalPaginas   = pageData?.totalPages   ?? 0;
    totalElementos = pageData?.totalElements ?? 0;

    // Mapeia resposta da API para objetos Tarefa
    app.tarefas = itens.map((item) => {
    // Estrutura do backend: responsavel: { id, responsavel: "Nome", cargo: {...} }
      const nomeResponsavel =
        typeof item.responsavel === "string"
          ? item.responsavel
          : item.responsavel?.responsavel ?? item.responsavel?.nome ?? "—";

      const usuario = new Usuario(nomeResponsavel);

      const statusBruto = String(item.statusAtividade ?? "").toUpperCase();
      const statusNorm = STATUS_NORMALIZADO[statusBruto] ?? "A Fazer";

      const prazoISO = item.prazo
        ? item.prazo.substring(0, 10)
        : item.dtCadastro
          ? item.dtCadastro.substring(0, 10)
          : "";

      const t = new Tarefa(
        item.titulo ?? "Sem título",
        item.prioridade ?? "—",
        usuario,
        item.descricao ?? "",
        prazoISO,
        item.id ?? null
      );
      t.setStatus(statusNorm);
      return t;
    });

    atualizarUI();
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    document.getElementById("listaTarefas").innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning d-flex align-items-center gap-2">
          <i class="bi bi-exclamation-triangle-fill"></i>
          Não foi possível carregar as tarefas: ${error.message}
        </div>
      </div>`;
  }
}

function mostrarCarregando() {
  document.getElementById("listaTarefas").innerHTML = `
    <div class="col-12 text-center text-muted py-5">
      <div class="spinner-border spinner-border-sm text-primary me-2"></div>
      Buscando tarefas...
    </div>`;
}

function renderizarListaVazia(msg = "Nenhuma tarefa encontrada.") {
  document.getElementById("listaTarefas").innerHTML = `
    <div class="col-12 text-center text-muted py-4">
      <i class="bi bi-inbox fs-3 d-block mb-2"></i>${msg}
    </div>`;
}

// ============================================================
// Responsáveis
// ============================================================
async function carregarResponsaveisNoSelect() {
  const select = document.getElementById("responsavel");
  try {
    const response = await fetch(RESPONSAVEIS_ENDPOINT);
    if (!response.ok) throw new Error(`Falha ao buscar responsáveis (${response.status})`);

    const data = await response.json();
    const lista = Array.isArray(data?.content) ? data.content : [];

    select.innerHTML = '<option value="" disabled selected>Escolher</option>';
    lista.forEach((item) => {
      const option = document.createElement("option");
      option.value = String(item.id);
      option.textContent = item.responsavel;
      select.appendChild(option);
    });

    atualizarFiltroResponsaveis();
  } catch (error) {
    console.error("Erro ao carregar responsáveis:", error);
    select.innerHTML = '<option value="" disabled selected>Não foi possível carregar</option>';
    atualizarFiltroResponsaveis();
  }
}

async function criarTarefaNoBackend(payload) {
  const response = await fetch(TAREFAS_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(montarErroBackend(errorBody, response.status));
  }

  const rawBody = await response.text();
  return rawBody ? JSON.parse(rawBody) : null;
}

// ============================================================
// Submit do formulário
// ============================================================
document.getElementById("taskForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const titulo = document.getElementById("titulo").value;
  const descricao = document.getElementById("descricao").value;
  const respSelect = document.getElementById("responsavel");
  const responsavelId = Number(respSelect.value);
  const responsavelNome = respSelect.options[respSelect.selectedIndex]?.text || "";
  const prio = document.getElementById("prioridade").value;
  const prazo = document.getElementById("prazo").value;
  const statusAtividade = STATUS_INICIAL_API;

  if (!Number.isSafeInteger(responsavelId)) {
    alert("Selecione um responsável válido.");
    return;
  }

  const payload = { titulo, descricao, responsavelId, prioridade: prio, statusAtividade };

  const submitBtn = this.querySelector("button[type='submit']");
  submitBtn.disabled = true;
  submitBtn.innerText = "Salvando...";

  try {
    const tarefaCriada = await criarTarefaNoBackend(payload);

    const usuario = new Usuario(responsavelNome);
    const novaTarefa = new Tarefa(titulo, prio, usuario, descricao, prazo, tarefaCriada?.id ?? null);

    if (tarefaCriada?.statusAtividade) {
      const statusNorm =
        STATUS_NORMALIZADO[tarefaCriada.statusAtividade.toUpperCase()] ?? tarefaCriada.statusAtividade;
      novaTarefa.setStatus(statusNorm);
    }

    this.reset();
    // Re-busca da API para incluir a nova tarefa na lista filtrada
    await buscarTarefasDoBackend();
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    alert(`Erro ao criar tarefa no backend: ${error.message}`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = "Adicionar Tarefa";
  }
});

// ============================================================
// UI — renderização (usa app.tarefas já carregadas da API)
// ============================================================
function atualizarUI() {
  const metricas = app.calcularProgresso();
  atualizarFiltroResponsaveis();

  // Cards de métricas (totais globais)
  document.getElementById("totalTxt").innerText = metricas.total;
  document.getElementById("afazerTxt").innerText = metricas.aFazer;
  document.getElementById("andamentoTxt").innerText = metricas.andamento;
  document.getElementById("concluidasTxt").innerText = metricas.concluidas;

  // Filtra por responsável e status (client-side — data já veio filtrada da API)
  const tarefasFiltradas = filtrarPorResponsavelEStatus();

  const lista = document.getElementById("listaTarefas");
  lista.innerHTML = "";

  if (tarefasFiltradas.length === 0) {
    renderizarListaVazia("Nenhuma tarefa encontrada para os filtros selecionados.");
    renderizarPaginacao();
    return;
  }

  tarefasFiltradas.forEach(({ tarefa: t, indiceOriginal }) => {
    const status = t.getStatus();

    let classeCor = "";
    if (status === "A Fazer") classeCor = "task-afazer";
    else if (status === "Em Andamento") classeCor = "task-andamento";
    else if (status === "Concluido") classeCor = "task-concluida";

    const prazoFormatado = t.prazo
      ? new Date(t.prazo + "T00:00:00").toLocaleDateString("pt-BR")
      : "";

    const prioLabel = PRIORIDADE_LABEL[t.prioridade?.toUpperCase()] ?? t.prioridade;

    lista.innerHTML += `
      <div class="col-12">
        <div class="task-card card p-4 ${classeCor} shadow-sm">
          <h5 class="fw-bold">${t.getTitulo()}</h5>
          <small class="text-muted">Responsável: ${t.responsavel.getNome()} | Prioridade: ${prioLabel}</small>
          ${prazoFormatado ? `<small class="d-block text-muted">Prazo: ${prazoFormatado}</small>` : ""}
          ${t.descricao ? `<p class="mb-0 mt-2 small text-secondary">${t.descricao}</p>` : ""}
          <div class="mt-3 d-flex align-items-center gap-2">
            <select class="form-select form-select-sm w-auto" onchange="mudarStatus(${indiceOriginal}, this.value)">
              <option value="A Fazer" ${status === "A Fazer" ? "selected" : ""}>A Fazer</option>
              <option value="Em Andamento" ${status === "Em Andamento" ? "selected" : ""}>Em Andamento</option>
              <option value="Concluido" ${status === "Concluido" ? "selected" : ""}>Concluído</option>
            </select>
            <button
              id="btn-salvar-${indiceOriginal}"
              class="btn btn-sm btn-outline-primary"
              onclick="salvarStatusNoBackend(${t.idBackend}, ${indiceOriginal})"
              title="Salvar status"
            >
              <i class="bi bi-floppy"></i>
            </button>
            <button
              id="btn-excluir-${indiceOriginal}"
              class="btn btn-sm btn-outline-danger ms-auto"
              onclick="excluirTarefa(${t.idBackend}, ${indiceOriginal})"
              title="Excluir tarefa"
            >
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
      </div>`;
  });

  renderizarPaginacao();
}

// ============================================================
// Filtros — API já retorna os dados filtrados; apenas mapeia para a UI
// ============================================================
function filtrarPorResponsavelEStatus() {
  return app.tarefas.map((tarefa, indiceOriginal) => ({ tarefa, indiceOriginal }));
}

// ============================================================
// Paginação
// ============================================================
function renderizarPaginacao() {
  const container = document.getElementById("paginacao");
  if (!container) return;

  // Oculta quando não há nenhum resultado
  if (totalElementos === 0) {
    container.innerHTML = "";
    return;
  }

  const inicio = paginaAtual * tamanhoPagina + 1;
  const fim    = Math.min((paginaAtual + 1) * tamanhoPagina, totalElementos);

  // ── Seletor de itens por página ──────────────────────────
  const opcoesTamanho = [5, 10, 25, 50].map((v) =>
    `<option value="${v}" ${v === tamanhoPagina ? "selected" : ""}>${v}</option>`
  ).join("");

  const seletorTamanho = `
    <div class="d-flex align-items-center gap-2 pagination-size-wrap">
      <small class="text-muted text-nowrap">Itens por página:</small>
      <select class="form-select form-select-sm pagination-size-select"
              onchange="alterarTamanhoPagina(Number(this.value))"
              aria-label="Itens por página">
        ${opcoesTamanho}
      </select>
    </div>`;

  // ── Info ─────────────────────────────────────────────────
  const info = `
    <small class="pagination-info text-muted text-nowrap">
      Exibindo <strong>${inicio}–${fim}</strong> de <strong>${totalElementos}</strong> tarefa(s)
    </small>`;

  // ── Botões de navegação (só quando há mais de 1 página) ──
  let botoesPaginacao = "";
  if (totalPaginas > 1) {
    // Monta array de índices a exibir (primeira, última, atual ±2)
    const indices = new Set();
    for (let i = 0; i < totalPaginas; i++) {
      if (i === 0 || i === totalPaginas - 1 || Math.abs(i - paginaAtual) <= 2) {
        indices.add(i);
      }
    }
    const paginasOrdenadas = [...indices].sort((a, b) => a - b);

    const itens = [];
    paginasOrdenadas.forEach((p, idx) => {
      if (idx > 0 && p - paginasOrdenadas[idx - 1] > 1) itens.push("...");
      itens.push(p);
    });

    const botoesPaginas = itens.map((p) => {
      if (p === "...") {
        return `<li class="page-item disabled"><span class="page-link page-ellipsis">…</span></li>`;
      }
      const ativo = p === paginaAtual ? "active" : "";
      return `
        <li class="page-item ${ativo}">
          <button class="page-link" onclick="irParaPagina(${p})">${p + 1}</button>
        </li>`;
    }).join("");

    botoesPaginacao = `
      <ul class="pagination pagination-sm mb-0">
        <li class="page-item ${paginaAtual === 0 ? "disabled" : ""}">
          <button class="page-link" onclick="irParaPagina(${paginaAtual - 1})" aria-label="Anterior">
            <i class="bi bi-chevron-left"></i>
          </button>
        </li>
        ${botoesPaginas}
        <li class="page-item ${paginaAtual >= totalPaginas - 1 ? "disabled" : ""}">
          <button class="page-link" onclick="irParaPagina(${paginaAtual + 1})" aria-label="Próximo">
            <i class="bi bi-chevron-right"></i>
          </button>
        </li>
      </ul>`;
  }

  container.innerHTML = `
    <nav class="pagination-nav" aria-label="Paginação de tarefas">
      ${seletorTamanho}
      ${info}
      ${botoesPaginacao}
    </nav>`;
}

/** Navega para a página indicada */
window.irParaPagina = function (pagina) {
  if (pagina < 0 || pagina >= totalPaginas) return;
  buscarTarefasDoBackend(pagina);
};

/** Altera o tamanho de página e volta para a página 0 */
window.alterarTamanhoPagina = function (novoTamanho) {
  tamanhoPagina = novoTamanho;
  buscarTarefasDoBackend(0);
};

function atualizarFiltroResponsaveis() {
  const filtro = document.getElementById("filtro-responsavel");
  const selectCadastro = document.getElementById("responsavel");
  if (!filtro || !selectCadastro) return;

  const valorAtual = filtro.value;
  filtro.innerHTML = '<option value="">Todos os responsáveis</option>';

  Array.from(selectCadastro.options)
    .filter((option) => option.value)
    .forEach((option) => {
      const novaOption = document.createElement("option");
      novaOption.value = option.value;          // ID numérico (enviado para a API)
      novaOption.textContent = option.textContent;
      filtro.appendChild(novaOption);
    });

  if (valorAtual) filtro.value = valorAtual;
}

// ============================================================
// Modal Responsáveis (iframe)
// ============================================================

/** Carrega o iframe somente após o modal estar totalmente visível (evita aria-hidden no foco) */
document.getElementById("modalResponsaveis")?.addEventListener("shown.bs.modal", function () {
  document.getElementById("iframeResponsaveis").src = "Front/responsaveis.html";
});

/** Limpa o src ao fechar para forçar reload na próxima abertura */
document.getElementById("modalResponsaveis")?.addEventListener("hidden.bs.modal", function () {
  document.getElementById("iframeResponsaveis").src = "";
});

/** Fecha o modal de responsáveis (chamado pelo iframe filho) */
window.fecharModalResponsaveis = function () {
  bootstrap.Modal.getInstance(document.getElementById("modalResponsaveis"))?.hide();
};

// ============================================================
// Handlers públicos (chamados pelo HTML)
// ============================================================

/** Chamado ao mudar responsável ou status — re-busca na API com os novos filtros */
window.filtrarTarefas = async function () {
  await buscarTarefasDoBackend();
};

/** Chamado ao mudar datas — re-busca na API */
window.filtrarTarefasPorData = async function () {
  await buscarTarefasDoBackend();
};

window.limparFiltros = function () {
  document.getElementById("filtro-responsavel").value = "";
  document.getElementById("filtro-status").value = "";
  document.getElementById("filtro-data-inicial").value = hojeISO();
  document.getElementById("filtro-data-final").value = amanhaISO();
  buscarTarefasDoBackend();
};

/** Atualiza apenas o estado local (sem re-renderizar) */
window.mudarStatus = function (id, novoStatus) {
  app.tarefas[id].setStatus(novoStatus);
};

/** Persiste o status atual no backend e re-renderiza */
window.salvarStatusNoBackend = async function (idBackend, indiceOriginal) {
  if (!idBackend) {
    alert("Esta tarefa não possui ID no backend e não pode ser salva.");
    return;
  }

  const tarefa = app.tarefas[indiceOriginal];
  const statusAPI = STATUS_PARA_API[tarefa.getStatus()] ?? tarefa.getStatus().toUpperCase();

  const btn = document.getElementById(`btn-salvar-${indiceOriginal}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  }

  try {
    const response = await fetch(`${TAREFAS_ENDPOINT}/${idBackend}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusAtividade: statusAPI }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(montarErroBackend(errorBody, response.status));
    }

    // Feedback visual de sucesso
    if (btn) {
      btn.innerHTML = '<i class="bi bi-check-lg"></i>';
      btn.classList.replace("btn-outline-primary", "btn-success");
      setTimeout(() => {
        btn.innerHTML = '<i class="bi bi-floppy"></i>';
        btn.classList.replace("btn-success", "btn-outline-primary");
        btn.disabled = false;
      }, 1500);
    }

    atualizarUI();
  } catch (error) {
    console.error("Erro ao salvar status:", error);
    if (btn) {
      btn.innerHTML = '<i class="bi bi-floppy"></i>';
      btn.disabled = false;
    }
    alert(`Erro ao salvar status: ${error.message}`);
  }
};

/** Exclui a tarefa no backend e remove da lista */
window.excluirTarefa = async function (idBackend, indiceOriginal) {
  if (!idBackend) {
    alert("Esta tarefa não possui ID no backend e não pode ser excluída.");
    return;
  }

  if (!confirm("Tem certeza que deseja excluir esta tarefa?")) return;

  const btn = document.getElementById(`btn-excluir-${indiceOriginal}`);
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';
  }

  try {
    const response = await fetch(`${TAREFAS_ENDPOINT}/${idBackend}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(montarErroBackend(errorBody, response.status));
    }

    // Remove do array local e re-renderiza
    app.tarefas.splice(indiceOriginal, 1);
    atualizarUI();
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    if (btn) {
      btn.innerHTML = '<i class="bi bi-trash"></i>';
      btn.disabled = false;
    }
    alert(`Erro ao excluir tarefa: ${error.message}`);
  }
};

// ============================================================
// Inicialização
// ============================================================
carregarResponsaveisNoSelect();
inicializarFiltrosData();
buscarTarefasDoBackend();
