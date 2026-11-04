import { TRPCError } from "@trpc/server";

import {
  createTaskSchema,
  taskIdSchema,
  updateTaskSchema,
  createTasksSchema,
  listTasksSchema,
} from "@/server/tasks/schemas";
import { taskStore } from "@/server/tasks/store";
import { createTRPCRouter, publicProcedure } from "../init";

export const taskRouter = createTRPCRouter({
  list: publicProcedure.query(() => {
    return taskStore.list();
  }),

  listInfinite: publicProcedure
    .input(listTasksSchema)
    .query(({ input }) => {
      return taskStore.listPage(input.limit, input.cursor);
    }),

  create: publicProcedure
    .input(createTaskSchema)
    .mutation(({ input }) => {
      return taskStore.create(input);
    }),

  createMany: publicProcedure
    .input(createTasksSchema)
    .mutation(({ input }) => {
      return taskStore.createMany(input);
    }),

  update: publicProcedure
    .input(updateTaskSchema)
    .mutation(({ input }) => {
      const { id, ...taskInput } = input;
      const task = taskStore.update(id, taskInput);

      if (!task) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tarefa não encontrada.",
        });
      }

      return task;
    }),

  delete: publicProcedure
    .input(
      taskIdSchema.transform((id) => ({ id })),
    )
    .mutation(({ input }) => {
      const deleted = taskStore.delete(input.id);

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Tarefa não encontrada.",
        });
      }

      return { id: input.id };
    }),
});
