import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(3)
  })
});

export type CreateCategoryPayload = z.infer<typeof createCategorySchema>["body"];
