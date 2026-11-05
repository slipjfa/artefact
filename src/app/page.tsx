import { TaskManager } from "@/components/tasks/task-manager";
import { appRouter } from "@/server/trpc/routers/_app";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 5;

export default async function Home() {
  const caller = appRouter.createCaller({});
  const initialPage = await caller.task.listInfinite({
    limit: PAGE_SIZE,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <TaskManager initialPage={initialPage} />
      </div>
    </main>
  );
}