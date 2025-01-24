import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { relations } from "drizzle-orm";

export const parts = pgTable("parts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name"),
  categoryId: uuid("category_id").references(() => categories.id)
});

export const partsRelations = relations(parts, ({ one }) => ({
  category: one(categories, {
    relationName: "category",
    fields: [parts.categoryId],
    references: [categories.id]
  })
}));

export type PartType = typeof parts.$inferSelect;
