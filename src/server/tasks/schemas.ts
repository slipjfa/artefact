import { z } from "zod";

export const taskIdSchema = z.uuid();

export const createTaskSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "O título é obrigatório.")
    .max(120, "O título deve ter no máximo 120 caracteres."),
  descricao: z
    .string()
    .trim()
    .max(1000, "A descrição deve ter no máximo 1000 caracteres.")
    .optional()
    .transform((value) => value || undefined),
});

export const updateTaskSchema = createTaskSchema.extend({
  id: taskIdSchema,
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
