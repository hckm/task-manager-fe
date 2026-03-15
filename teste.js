
const meuProjeto = new TaskFlowGerenciador();


const user1 = new Usuario("Lucas", "lucas@email.com", "Desenvolvedor");
const user2 = new Usuario("Maria", "maria@email.com", "Designer");


const t1 = new Tarefa("Criar Banco de Dados", "Configurar SQLite", "Alta", user1);
const t2 = new Tarefa("Desenvolver Layout", "Fazer o CSS do topo", "Média", user2);

meuProjeto.adicionarTarefa(t1);
meuProjeto.adicionarTarefa(t2);


t1.setStatus("Concluido");


const progresso = meuProjeto.calcularProgresso();
console.log(`Progresso do Projeto: ${progresso.percentual}%`);
console.log(`Total: ${progresso.total} | Concluídas: ${progresso.concluidas}`);