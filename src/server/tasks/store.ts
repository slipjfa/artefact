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
};

const tasks = (globalForTaskStore.taskStore ??= new Map<string, Task>()); 

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
    return tasks.delete(id);
  },

  createMany(inputs: CreateTaskInput[]): Task[] {
    return inputs.map((input) => this.create(input));
  },

  listPage(limit: number, cursor?: string) {
    const allTasks = Array.from(tasks.values());

    const cursorIndex = cursor
      ? allTasks.findIndex((task) => task.id === cursor)
      : -1;

    if (cursor && cursorIndex === -1) {
      return {
        items: [],
        nextCursor: undefined,
        total: allTasks.length,
      };
    }

    const startIndex = cursorIndex + 1;
    const items = allTasks.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allTasks.length;

    return {
      items,
      nextCursor: hasMore ? items[items.length - 1]?.id : undefined,
      total: allTasks.length,
    };
  },
};
