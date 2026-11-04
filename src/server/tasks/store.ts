import "server-only";

import { randomUUID } from "node:crypto";

import type { CreateTaskInput } from "./schemas";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  dataCriacao: number;
};

// This Map is intentionally in-memory: persistence is outside the scope
// of the assignment. Data is lost when the server process restarts.
const tasks = new Map<string, Task>();

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
};
