"use client";

import { useState, type SyntheticEvent } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import type { Task } from "@/server/tasks/store";
import { useTRPC } from "@/trpc/client";

type TaskManagerProps = {
  initialTasks: Task[];
};

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

const sampleTasks = [
  {
    titulo: "Revisar documentação do projeto",
    
  },
  {
    titulo: "Preparar apresentação",
    descricao: "",
  },
  {
    titulo: "Atualizar dependências",
    descricao: undefined,
  },
  {
    titulo: "Corrigir bugs pendentes",
    descricao: "Revisar os problemas identificados durante os testes.",
  },
  {
    titulo: "Escrever testes automatizados",
    descricao: "Adicionar cobertura para as operações principais.",
  },
  {
    titulo: "Revisar interface",
    descricao: "Verificar responsividade e consistência visual.",
  },
  {
    titulo: "Organizar arquivos do projeto",
    descricao: "Revisar estrutura de pastas e remover arquivos desnecessários.",
  },
  {
    titulo: "Preparar versão de entrega",
    descricao: "Executar validações finais e revisar o README.",
  },
];

export function TaskManager({ initialTasks }: TaskManagerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const { data: tasks = initialTasks } = useQuery(
    trpc.task.list.queryOptions(undefined, {
      initialData: initialTasks,
    }),
  );

  async function refreshTasks() {
    await queryClient.invalidateQueries(
      trpc.task.list.queryFilter(),
    );
  }

  function resetForm() {
    setTitulo("");
    setDescricao("");
    setEditingTask(null);
  }

  const createMutation = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: async () => {
        await refreshTasks();
        resetForm();
        setError("");
        setFeedback("Tarefa criada com sucesso.");
      },
      onError: (mutationError) => {
        setError(mutationError.message);
        setFeedback("");
      },
    }),
  );

  const importMutation = useMutation(
    trpc.task.createMany.mutationOptions({
      onSuccess: async (createdTasks) => {
        await refreshTasks();
        setError("");
        setFeedback(
          `${createdTasks.length} tarefas de exemplo adicionadas com sucesso.`,
        );
      },
      onError: (mutationError) => {
        setError(mutationError.message);
        setFeedback("");
      },
    }),
  );

  const updateMutation = useMutation(
    trpc.task.update.mutationOptions({
      onSuccess: async () => {
        await refreshTasks();
        resetForm();
        setError("");
        setFeedback("Tarefa atualizada com sucesso.");
      },
      onError: (mutationError) => {
        setError(mutationError.message);
        setFeedback("");
      },
    }),
  );

  const deleteMutation = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: async () => {
        await refreshTasks();

        if (editingTask?.id === deleteMutation.variables) {
          resetForm();
        }

        setError("");
        setFeedback("Tarefa excluída com sucesso.");
      },
      onError: (mutationError) => {
        setError(mutationError.message);
        setFeedback("");
      },
    }),
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();

    setError("");
    setFeedback("");

    const taskInput = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
    };

    if (editingTask) {
      updateMutation.mutate({
        id: editingTask.id,
        ...taskInput,
      });
      return;
    }

    createMutation.mutate(taskInput);
  }

  function handleImportSamples() {
    setError("");
    setFeedback("");
    importMutation.mutate(sampleTasks);
  }  
  function handleEdit(task: Task) {
    setEditingTask(task);
    setTitulo(task.titulo);
    setDescricao(task.descricao ?? "");
    setError("");
    setFeedback("");
  }

  function handleCancelEdit() {
    resetForm();
    setError("");
    setFeedback("");
  }

  function handleDelete(id: string) {
    setError("");
    setFeedback("");
    deleteMutation.mutate(id);
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-semibold">
          {editingTask ? "Editar tarefa" : "Nova tarefa"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="titulo"
              className="mb-1.5 block text-sm font-medium"
            >
              Título
            </label>
            <input
              id="titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              maxLength={120}
              required
              placeholder="O que precisa ser feito?"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="mb-1.5 block text-sm font-medium"
            >
              Descrição <span className="font-normal text-slate-500">(opcional)</span>
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="Adicione detalhes sobre a tarefa..."
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isSaving || deleteMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving
                ? "Salvando..."
                : editingTask
                  ? "Salvar alterações"
                  : "Criar tarefa"}
            </button>

            {editingTask && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </form>
      </section>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {feedback && (
        <p
          role="status"
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          {feedback}
        </p>
      )}

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Tarefas</h2>
            <span className="text-sm text-slate-500">
              {tasks.length} {tasks.length === 1 ? "tarefa" : "tarefas"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleImportSamples}
            disabled={importMutation.isPending || isSaving || deleteMutation.isPending}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importMutation.isPending
              ? "Importando..."
              : "Carregar tarefas de exemplo"}
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-slate-700">
              Nenhuma tarefa cadastrada.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Use o formulário acima para criar sua primeira tarefa.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h3 className="font-semibold break-words">
                      {task.titulo}
                    </h3>

                    {task.descricao && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {task.descricao}
                      </p>
                    )}

                    <p className="mt-3 text-xs text-slate-400">
                      Criada em {formatDate(task.dataCriacao)}
                    </p>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteMutation.isPending || isSaving}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === task.id
                        ? "Excluindo..."
                        : "Excluir"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
