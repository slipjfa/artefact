
"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";

import type { Task } from "@/server/tasks/store";
import { useTRPC } from "@/trpc/client";

type TaskPage = {
  items: Task[];
  nextCursor: number | undefined;
  total: number;
};

type TaskManagerProps = {
  initialPage: TaskPage;
};

type Language = "en" | "pt";

const PAGE_SIZE = 5;

const translations = {
  en: {
    appTitle: "Task Manager",
    appDescription: "Organize your tasks in one place.",
    newTask: "New task",
    editTask: "Edit task",
    title: "Title",
    description: "Description",
    optional: "optional",
    titlePlaceholder: "What needs to be done?",
    descriptionPlaceholder: "Add details about this task...",
    create: "Create task",
    save: "Save changes",
    saving: "Saving...",
    cancel: "Cancel",
    tasks: "Tasks",
    loaded: (loaded: number, total: number) =>
      `${loaded} of ${total} tasks loaded`,
    importSamples: "Load sample tasks",
    importing: "Importing...",
    emptyTitle: "No tasks yet.",
    emptyDescription: "Use the form above to create your first task.",
    createdAt: "Created at",
    edit: "Edit",
    delete: "Delete",
    deleting: "Deleting...",
    loading: "Loading...",
    loadMore: "Load more",
    allLoaded: "All tasks have been loaded.",
    taskCreated: "Task created successfully.",
    taskUpdated: "Task updated successfully.",
    taskDeleted: "Task deleted successfully.",
    samplesImported: (count: number) =>
      `${count} sample tasks added successfully.`,
    loadError: "Error loading tasks:",
    requiredTitle: "Title is required.",
    tooManyTitle: "Title must be at most 120 characters.",
    tooLongDescription: "Description must be at most 1000 characters.",
    taskNotFound: "Task not found.",
    language: "Language",
  },
  pt: {
    appTitle: "Gerenciador de Tarefas",
    appDescription: "Organize suas tarefas em um só lugar.",
    newTask: "Nova tarefa",
    editTask: "Editar tarefa",
    title: "Título",
    description: "Descrição",
    optional: "opcional",
    titlePlaceholder: "O que precisa ser feito?",
    descriptionPlaceholder: "Adicione detalhes sobre a tarefa...",
    create: "Criar tarefa",
    save: "Salvar alterações",
    saving: "Salvando...",
    cancel: "Cancelar",
    tasks: "Tarefas",
    loaded: (loaded: number, total: number) =>
      `${loaded} de ${total} tarefas carregadas`,
    importSamples: "Carregar tarefas de exemplo",
    importing: "Importando...",
    emptyTitle: "Nenhuma tarefa cadastrada.",
    emptyDescription: "Use o formulário acima para criar sua primeira tarefa.",
    createdAt: "Criada em",
    edit: "Editar",
    delete: "Excluir",
    deleting: "Excluindo...",
    loading: "Carregando...",
    loadMore: "Carregar mais",
    allLoaded: "Todas as tarefas foram carregadas.",
    taskCreated: "Tarefa criada com sucesso.",
    taskUpdated: "Tarefa atualizada com sucesso.",
    taskDeleted: "Tarefa excluída com sucesso.",
    samplesImported: (count: number) =>
      `${count} tarefas de exemplo adicionadas com sucesso.`,
    loadError: "Erro ao carregar tarefas:",
    requiredTitle: "O título é obrigatório.",
    tooManyTitle: "O título deve ter no máximo 120 caracteres.",
    tooLongDescription: "A descrição deve ter no máximo 1000 caracteres.",
    taskNotFound: "Tarefa não encontrada.",
    language: "Idioma",
  },
} as const;

function formatDate(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(
    language === "en" ? "en-US" : "pt-BR",
    {
      dateStyle: "short",
      timeStyle: "short",
      timeZone: "UTC",
    },
  ).format(new Date(timestamp));
}

function getSampleTasks(language: Language) {
  if (language === "en") {
    return [
      { titulo: "Review project documentation" },
      { titulo: "Prepare presentation", descricao: "" },
      { titulo: "Update dependencies", descricao: undefined },
      {
        titulo: "Fix pending bugs",
        descricao: "Review the issues identified during testing.",
      },
      {
        titulo: "Write automated tests",
        descricao: "Add test coverage for the main operations.",
      },
      {
        titulo: "Review interface",
        descricao: "Check responsiveness and visual consistency.",
      },
      {
        titulo: "Organize project files",
        descricao: "Review the folder structure and remove unnecessary files.",
      },
      {
        titulo: "Prepare release",
        descricao: "Run final checks and review the README.",
      },
    ];
  }

  return [
    { titulo: "Revisar documentação do projeto" },
    { titulo: "Preparar apresentação", descricao: "" },
    { titulo: "Atualizar dependências", descricao: undefined },
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
}

export function TaskManager({ initialPage }: TaskManagerProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [language, setLanguage] = useState<Language>("en");
  const t = translations[language];

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");

  const formRef = useRef<HTMLElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    error: queryError,
    isError: isQueryError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(
    trpc.task.listInfinite.infiniteQueryOptions(
      { limit: PAGE_SIZE },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialData: {
          pages: [initialPage],
          pageParams: [null],
        },
        staleTime: 30_000,
      },
    ),
  );

  const tasks = data.pages.flatMap((page) => page.items);

  function translateError(message: string) {
    const errorMessages: Record<string, string> = {
      TASK_TITLE_REQUIRED: t.requiredTitle,
      TASK_TITLE_TOO_LONG: t.tooManyTitle,
      TASK_DESCRIPTION_TOO_LONG: t.tooLongDescription,
      TASK_NOT_FOUND: t.taskNotFound,
    };

    return errorMessages[message] ?? message;
  }

  useEffect(() => {
    document.documentElement.lang =
      language === "en" ? "en" : "pt-BR";
  }, [language]);

  async function refreshTasks() {
    await queryClient.invalidateQueries(
      trpc.task.listInfinite.infiniteQueryFilter({
        limit: PAGE_SIZE,
      }),
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
        setFeedback(t.taskCreated);
      },
      onError: (mutationError) => {
        setError(translateError(mutationError.message));
        setFeedback("");
      },
    }),
  );

  const importMutation = useMutation(
    trpc.task.createMany.mutationOptions({
      onSuccess: async (createdTasks) => {
        await refreshTasks();
        setError("");
        setFeedback(t.samplesImported(createdTasks.length));
      },
      onError: (mutationError) => {
        setError(translateError(mutationError.message));
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
        setFeedback(t.taskUpdated);
      },
      onError: (mutationError) => {
        setError(translateError(mutationError.message));
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
        setFeedback(t.taskDeleted);
      },
      onError: (mutationError) => {
        setError(translateError(mutationError.message));
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
  };

  function handleImportSamples() {
    setError("");
    setFeedback("");
    importMutation.mutate(getSampleTasks(language));
  }

  function handleEdit(task: Task) {
    setEditingTask(task);
    setTitulo(task.titulo);
    setDescricao(task.descricao ?? "");
    setError("");
    setFeedback("");

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    titleInputRef.current?.focus({ preventScroll: true });
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

  useEffect(() => {
    const element = loadMoreRef.current;

    if (!element || !hasNextPage) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: "150px",
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <div className="space-y-8">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t.appTitle}
          </h1>
          <p className="mt-2 text-slate-600">
            {t.appDescription}
          </p>
        </div>

        <div
          className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs"
          role="group"
          aria-label={t.language}
        >
          <button
            type="button"
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
            className={`rounded-md px-2 py-1.5 font-medium transition ${
              language === "en"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            EN
          </button>
          <button
            type="button"
            onClick={() => setLanguage("pt")}
            aria-pressed={language === "pt"}
            className={`rounded-md px-2 py-1.5 font-medium transition ${
              language === "pt"
                ? "bg-slate-100 text-slate-900"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            PT
          </button>
        </div>
      </header>

      <section
        ref={formRef}
        className="scroll-mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="mb-5 text-xl font-semibold">
          {editingTask ? t.editTask : t.newTask}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="titulo"
              className="mb-1.5 block text-sm font-medium"
            >
              {t.title}
            </label>
            <input
              ref={titleInputRef}
              id="titulo"
              type="text"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              maxLength={120}
              required
              placeholder={t.titlePlaceholder}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="descricao"
              className="mb-1.5 block text-sm font-medium"
            >
              {t.description}{" "}
              <span className="font-normal text-slate-500">
                ({t.optional})
              </span>
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(event) => setDescricao(event.target.value)}
              maxLength={1000}
              rows={3}
              placeholder={t.descriptionPlaceholder}
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
                ? t.saving
                : editingTask
                  ? t.save
                  : t.create}
            </button>

            {editingTask && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
              >
                {t.cancel}
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
            <h2 className="text-xl font-semibold">{t.tasks}</h2>
            <span className="text-sm text-slate-500">
              {t.loaded(tasks.length, data.pages[0].total)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleImportSamples}
            disabled={
              importMutation.isPending ||
              isSaving ||
              deleteMutation.isPending
            }
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {importMutation.isPending
              ? t.importing
              : t.importSamples}
          </button>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="font-medium text-slate-700">
              {t.emptyTitle}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {t.emptyDescription}
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
                    <h3 className="break-words font-semibold">
                      {task.titulo}
                    </h3>

                    {task.descricao && (
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                        {task.descricao}
                      </p>
                    )}

                    <div className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs text-slate-500">
                      <p className="break-all">
                        <span className="font-medium text-slate-600">
                          ID:
                        </span>{" "}
                        <code>{task.id}</code>
                      </p>
                      <p>
                        <span className="font-medium text-slate-600">
                          {t.createdAt}:
                        </span>{" "}
                        {formatDate(task.dataCriacao, language)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(task)}
                      disabled={deleteMutation.isPending}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      {t.edit}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(task.id)}
                      disabled={deleteMutation.isPending || isSaving}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      {deleteMutation.isPending &&
                      deleteMutation.variables === task.id
                        ? t.deleting
                        : t.delete}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {isQueryError && (
          <p role="alert" className="mt-4 text-sm text-red-700">
            {t.loadError} {translateError(queryError.message)}
          </p>
        )}

        {hasNextPage && (
          <div
            ref={loadMoreRef}
            className="mt-6 flex justify-center"
          >
            <button
              type="button"
              onClick={() => void fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFetchingNextPage ? t.loading : t.loadMore}
            </button>
          </div>
        )}

        {!hasNextPage && tasks.length > 0 && (
          <p className="mt-6 text-center text-sm text-slate-400">
            {t.allLoaded}
          </p>
        )}
      </section>
    </div>
  );
}
