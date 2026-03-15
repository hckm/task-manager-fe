
const gerenciador = new TaskFlowGerenciador();


const taskForm = document.getElementById('taskForm');
const listaTarefas = document.getElementById('listaTarefas');
const percentualTxt = document.getElementById('percentualTxt');
const totalTxt = document.getElementById('totalTxt');
const concluidasTxt = document.getElementById('concluidasTxt');
const progressoBar = document.getElementById('progressoBar');


function atualizarInterface() {
    const metricas = gerenciador.calcularProgresso();

    
    percentualTxt.innerText = `${metricas.percentual}%`;
    totalTxt.innerText = metricas.total;
    concluidasTxt.innerText = `${metricas.concluidas} concluídas`;

    
    progressoBar.style.width = `${metricas.percentual}%`;

    
    renderizarLista();
}


function renderizarLista() {
    listaTarefas.innerHTML = ''; 

    gerenciador.tarefas.forEach((tarefa, index) => {
        const isConcluida = tarefa.getStatus() === "Concluido";
        
        const card = document.createElement('div');
        card.className = `col`;
        card.innerHTML = `
            <div class="task-item ${isConcluida ? 'concluido' : ''} dashboard-card bg-white shadow-sm">
                <div>
                    <h5 class="mb-1">${tarefa.getTitulo()}</h5>
                    <small class="text-muted">Responsável: <strong>${tarefa.responsavel.getNome()}</strong> | Prioridade: ${tarefa.prioridade}</small>
                </div>
                <div>
                    ${!isConcluida ? 
                        `<button class="btn btn-sm btn-outline-success" onclick="concluirTarefa(${index})">Concluir</button>` : 
                        `<span class="badge bg-success status-badge">✓ Finalizada</span>`
                    }
                </div>
            </div>
        `;
        listaTarefas.appendChild(card);
    });
}


taskForm.addEventListener('submit', (e) => {
    e.preventDefault(); 

   
    const titulo = document.getElementById('titulo').value;
    const respNome = document.getElementById('responsavel').value;
    const prioridade = document.getElementById('prioridade').value;

    
    const novoUsuario = new Usuario(respNome, `${respNome.toLowerCase()}@etec.com`, "Membro");
    const novaTarefa = new Tarefa(titulo, "Descrição padrão", prioridade, novoUsuario);

    
    gerenciador.adicionarTarefa(novaTarefa);
    taskForm.reset();

    
    atualizarInterface();
});


window.concluirTarefa = function(index) {
    gerenciador.tarefas[index].setStatus("Concluido");
    atualizarInterface();
};