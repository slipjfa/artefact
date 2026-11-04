import { TaskManager } from "@/components/tasks/task-manager";
import { appRouter } from "@/server/trpc/routers/_app";

// The task store is in memory, so read it on every request.
export const dynamic = "force-dynamic";

export default async function Home() {
  const caller = appRouter.createCaller({});
  const tasks = await caller.task.list();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Gerenciador de Tarefas
          </h1>
          <p className="mt-2 text-slate-600">
            Organize suas tarefas em um só lugar.
          </p>
        </header>

        <TaskManager initialTasks={tasks} />
      </div>
    </main>
  );
}
