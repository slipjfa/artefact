# Gerenciador de Tarefas

Aplicação web para gerenciamento de tarefas, desenvolvida como solução para um desafio técnico.

## Funcionalidades

- Listagem de tarefas com carregamento inicial no servidor.
- Criação, edição e exclusão de tarefas.
- Validação de campos e mensagens de feedback para operações bem-sucedidas ou com erro.
- Importação de tarefas de exemplo para facilitar a demonstração.
- Paginação infinita durante a rolagem da lista.

Cada tarefa possui um identificador único gerado automaticamente, título obrigatório, descrição opcional e data de criação.

## Tecnologias

- **Next.js 15** — framework React com App Router e renderização no servidor.
- **React** — construção da interface com componentes e hooks.
- **TypeScript** — tipagem estática.
- **tRPC** — comunicação tipada entre a interface e as operações do servidor.
- **TanStack React Query** — gerenciamento de requisições, mutações e paginação infinita.
- **Zod** — validação dos dados de entrada.
- **Tailwind CSS** — estilização da interface.

## Requisitos

- Node.js 20.9 ou superior.
- pnpm.

## Como executar

Clone o repositório e acesse o diretório do projeto:

```bash
git clone https://github.com/slipjfa/artefact.git
cd artefact
```

Instale as dependências:

```bash
pnpm install
```

Inicie o servidor de desenvolvimento:

```bash
pnpm dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Arquitetura

A aplicação utiliza o App Router do Next.js. A página inicial carrega a primeira página de tarefas diretamente pelo servidor, evitando uma requisição HTTP adicional para obter os dados iniciais.

As operações realizadas pela interface são enviadas por meio do tRPC. Os procedimentos validam os dados de entrada com Zod e delegam as operações ao armazenamento em memória.

Principais diretórios:

```text
src/
├── app/                  # Página inicial, layout e endpoint do tRPC
├── components/tasks/     # Interface e gerenciamento de tarefas
├── server/
│   ├── tasks/            # Validação e armazenamento das tarefas
│   └── trpc/             # Inicialização e procedimentos do tRPC
└── trpc/                 # Cliente e provedores do frontend
```

## Armazenamento

Os dados são mantidos em memória no processo do servidor, conforme solicitado no desafio. Não é necessário configurar banco de dados ou variáveis de ambiente.

**Importante:** as tarefas são perdidas quando o processo do servidor é reiniciado. Como o armazenamento não é compartilhado entre processos ou instâncias independentes, a aplicação não oferece persistência em produção.

## Validação

Para verificar os tipos, executar o lint e validar a compilação de produção:

```bash
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```
