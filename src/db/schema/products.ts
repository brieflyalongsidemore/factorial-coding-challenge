import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";
import { categories } from "./categories";
import { relations } from "drizzle-orm";

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name"),
  imageURL: varchar("image"),
  categoryId: uuid("category_id").references(() => categories.id)
});

export const productsRelations = relations(products, ({ one }) => ({
  category: one(categories, {
    relationName: "category",
    fields: [products.categoryId],
    references: [categories.id]
  })
}));

export type PresetType = typeof products.$inferSelect;
