
import "server-only";

import { randomUUID } from "node:crypto";

import type { CreateTaskInput } from "./schemas";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
};

const globalForTaskStore = globalThis as typeof globalThis & {
  taskStore?: Map<string, Task>;
  taskOrder?: Map<string, number>;
  nextTaskOrder?: number;
};

const tasks = (globalForTaskStore.taskStore ??= new Map<string, Task>());
const taskOrder = (globalForTaskStore.taskOrder ??= new Map<string, number>());

globalForTaskStore.nextTaskOrder ??= 0;

export const taskStore = {
  list(): Task[] {
    return Array.from(tasks.values());
  },

  create(input: CreateTaskInput): Task {
    const task: Task = {
      id: randomUUID(),
      titulo: input.titulo,
      descricao: input.descricao,
      dataCriacao: Date.now(),
    };

    tasks.set(task.id, task);
    taskOrder.set(task.id, globalForTaskStore.nextTaskOrder!);
    globalForTaskStore.nextTaskOrder!++;

    return task;
  },

  update(
    id: string,
    input: CreateTaskInput,
  ): Task | null {
    const existingTask = tasks.get(id);

    if (!existingTask) {
      return null;
    }

    const updatedTask: Task = {
      ...existingTask,
      titulo: input.titulo,
      descricao: input.descricao,
    };

    tasks.set(id, updatedTask);

    return updatedTask;
  },

  delete(id: string): boolean {
    const deleted = tasks.delete(id);

    if (deleted) {
      taskOrder.delete(id);
    }

    return deleted;
  },

  createMany(inputs: CreateTaskInput[]): Task[] {
    return inputs.map((input) => this.create(input));
  },

  listPage(limit: number, cursor?: number) {
    const orderedTasks = Array.from(tasks.values())
      .filter(
        (task) =>
          cursor === undefined || (taskOrder.get(task.id) ?? -1) > cursor,
      )
      .sort(
        (a, b) =>
          (taskOrder.get(a.id) ?? 0) - (taskOrder.get(b.id) ?? 0),
      );

    // Fetch one extra item to determine whether another page exists.
    const candidates = orderedTasks.slice(0, limit + 1);
    const hasMore = candidates.length > limit;
    const items = candidates.slice(0, limit);
    const lastItem = items[items.length - 1];

    return {
      items,
      nextCursor:
        hasMore && lastItem
          ? taskOrder.get(lastItem.id)
          : undefined,
      total: tasks.size,
    };
  },
};
