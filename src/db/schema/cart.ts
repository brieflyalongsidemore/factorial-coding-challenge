import { pgTable, uuid } from "drizzle-orm/pg-core";
import { products } from "./products";
import { partOptions } from "./partOptions";
import { relations } from "drizzle-orm";

export const cart = pgTable("cart", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").references(() => products.id),
  userId: uuid("user_id")
});

export const cartRelations = relations(cart, ({ one }) => ({
  product: one(products, {
    relationName: "product",
    fields: [cart.productId],
    references: [products.id]
  })
}));

export const cartOptions = pgTable("cart_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id")
    .references(() => cart.id)
    .notNull(),
  optionId: uuid("option_id")
    .references(() => partOptions.id)
    .notNull()
});

export const cartOptionsRelations = relations(cartOptions, ({ one }) => ({
  cart: one(cart, {
    fields: [cartOptions.cartId],
    references: [cart.id],
    relationName: "cart_options_cart"
  }),
  option: one(partOptions, {
    fields: [cartOptions.optionId],
    references: [partOptions.id],
    relationName: "cart_options_part_option"
  })
}));

export type CartType = typeof cart.$inferSelect;

export type CartOption = typeof cartOptions.$inferSelect;
