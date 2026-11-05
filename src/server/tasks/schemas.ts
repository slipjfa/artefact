import { z } from "zod";

export const taskIdSchema = z.uuid();

export const createTaskSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "TASK_TITLE_REQUIRED")
    .max(120, "TASK_TITLE_TOO_LONG"),
  descricao: z
    .string()
    .trim()
    .max(1000, "TASK_DESCRIPTION_TOO_LONG")
    .optional()
    .transform((value) => value || undefined),
});


export const createTasksSchema = z
  .array(createTaskSchema)
  .min(1)
  .max(50);

export const updateTaskSchema = createTaskSchema.extend({
  id: taskIdSchema,
});

export const listTasksSchema = z.object({
  limit: z.number().int().min(1).max(50).default(5),
  cursor: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional()
    .transform((value) => value ?? undefined),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;