class TaskFlowGerenciador {
    constructor() {
        this.tarefas = [];
        this.usuarios = [];
    }

    adicionarTarefa(tarefa) {
        this.tarefas.push(tarefa);
    }

    
    calcularProgresso() {
        if (this.tarefas.length === 0) return 0;

        const concluidas = this.tarefas.filter(t => t.getStatus() === "Concluido").length;
        const total = this.tarefas.length;
        
       
        return {
            total: total,
            concluidas: concluidas,
            percentual: ((concluidas / total) * 100).toFixed(1)
        };
    }
}