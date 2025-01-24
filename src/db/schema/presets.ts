import { pgTable, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { partOptions } from "./partOptions";
import { parts } from "./parts";
import { relations } from "drizzle-orm";

export const productPresets = pgTable("presets", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id),
  partId: uuid("part_id").references(() => parts.id),
  partOptionId: uuid("part_option_id").references(() => partOptions.id)
});

export const productPresetRelations = relations(productPresets, ({ one }) => ({
  product: one(products, {
    relationName: "product",
    fields: [productPresets.productId],
    references: [products.id]
  }),
  part: one(parts, {
    relationName: "part",
    fields: [productPresets.partId],
    references: [parts.id]
  }),
  partOption: one(partOptions, {
    relationName: "partOption",
    fields: [productPresets.partOptionId],
    references: [partOptions.id]
  })
}));

export type ProductPresetType = typeof productPresets.$inferSelect;
