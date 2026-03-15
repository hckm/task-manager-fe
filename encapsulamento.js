<script>

class Usuario {
    #nome;
    constructor(nome, email, funcao) {
        this.#nome = nome;
        this.email = email;
        this.funcao = funcao;
    }
    getNome() { return this.#nome; }
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
    getTitulo() { return this.#titulo; }
    getStatus() { return this.#status; }
    setStatus(novoStatus) { this.#status = novoStatus; }
}

class TaskFlowGerenciador {
    constructor() { this.tarefas = []; }
    adicionarTarefa(tarefa) { this.tarefas.push(tarefa); }
    calcularProgresso() {
        if (this.tarefas.length === 0) return { total: 0, concluidas: 0, percentual: 0 };
        const concluidas = this.tarefas.filter(t => t.getStatus() === "Concluido").length;
        return { total: this.tarefas.length, concluidas, percentual: ((concluidas / this.tarefas.length) * 100).toFixed(0) };
    }
}


const gerenciador = new TaskFlowGerenciador();

document.getElementById('taskForm').addEventListener('submit', function(e) {
    e.preventDefault();

    
    const titulo = document.getElementById('titulo').value;
    const respNome = document.getElementById('responsavel').value;
    const prioridade = document.getElementById('prioridade').value;

    
    const user = new Usuario(respNome, "email@exemplo.com", "Membro");
    const task = new Tarefa(titulo, prioridade, user);

    
    gerenciador.adicionarTarefa(task);
    this.reset(); // Limpa o formulário
    atualizarTela();
});

function atualizarTela() {
    const metricas = gerenciador.calcularProgresso();
    
    // Atualiza os números no topo
    document.getElementById('totalTxt').innerText = metricas.total;
    document.getElementById('concluidasTxt').innerText = `${metricas.concluidas} concluídas`;
    document.getElementById('percentualTxt').innerText = `${metricas.percentual}%`;
    document.getElementById('progressoBar').style.width = `${metricas.percentual}%`;

    // Desenha a lista
    const lista = document.getElementById('listaTarefas');
    lista.innerHTML = '';
    gerenciador.tarefas.forEach((t, i) => {
        const check = t.getStatus() === "Concluido";
        lista.innerHTML += `
            <div class="col-12 mb-2">
                <div class="p-3 bg-white shadow-sm border-start border-4 ${check ? 'border-success' : 'border-primary'} d-flex justify-content-between align-items-center rounded">
                    <div>
                        <strong>${t.getTitulo()}</strong> <br>
                        <small class="text-muted">${t.responsavel.getNome()} | ${t.prioridade}</small>
                    </div>
                    ${!check ? `<button class="btn btn-sm btn-success" onclick="finalizar(${i})">Concluir</button>` : '<span>✅</span>'}
                </div>
            </div>`;
    });
}

function finalizar(id) {
    gerenciador.tarefas[id].setStatus("Concluido");
    atualizarTela();
}
</script>