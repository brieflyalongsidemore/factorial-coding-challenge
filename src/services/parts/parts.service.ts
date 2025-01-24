import { parts, PartType } from "db/schema/parts";
import db from "db";
import { eq } from "drizzle-orm";
import { z } from "zod";

export class PartsService {
  public async create(payload: CreatePartPayload) {
    return db.insert(parts).values({ ...payload });
  }

  public async getCategoryParts(categoryId: string): Promise<PartType[]> {
    const categoryParts = await db.select().from(parts).where(eq(parts.categoryId, categoryId));
    return categoryParts;
  }
}

export const createPartPayloadSchema = z.object({
  body: z.object({
    categoryId: z.string().min(3),
    name: z.string().min(3)
  })
});

export type CreatePartPayload = z.infer<typeof createPartPayloadSchema>["body"];
