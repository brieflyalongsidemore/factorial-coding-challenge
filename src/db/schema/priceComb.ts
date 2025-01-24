import { pgTable, uuid, varchar, integer } from "drizzle-orm/pg-core";
import { partOptions } from "./partOptions";
import { relations } from "drizzle-orm";

export const priceCombination = pgTable("price_combination", {
  id: uuid("id").primaryKey().defaultRandom(),
  optionToAdjustId: uuid("option_to_adjust_id")
    .references(() => partOptions.id)
    .notNull(),
  triggerOptionId: uuid("trigger_option_id")
    .references(() => partOptions.id)
    .notNull(),
  reason: varchar("reason"),
  priceDiff: integer().notNull()
});

export const priceCombinationRelations = relations(priceCombination, ({ one }) => ({
  optionToAdjust: one(partOptions, {
    relationName: "optionToAdjust",
    fields: [priceCombination.optionToAdjustId],
    references: [partOptions.id]
  }),
  triggerOption: one(partOptions, {
    relationName: "triggerOption",
    fields: [priceCombination.triggerOptionId],
    references: [partOptions.id]
  })
}));

export type PriceCombinationType = typeof priceCombination.$inferSelect;
