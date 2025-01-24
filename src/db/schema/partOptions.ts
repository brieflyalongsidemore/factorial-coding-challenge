import { pgTable, varchar, uuid, boolean, integer } from "drizzle-orm/pg-core";
import { parts } from "./parts";
import { relations } from "drizzle-orm";

export const partOptions = pgTable("part_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  partId: uuid("part_id").references(() => parts.id),
  name: varchar("name"),
  availability: boolean().default(true),
  basePrice: integer("base_price").notNull()
});

export const partOptionsRelations = relations(partOptions, ({ one }) => ({
  part: one(parts, {
    fields: [partOptions.partId],
    references: [parts.id],
    relationName: "part_options_part"
  })
}));

export type PartOptionType = typeof partOptions.$inferSelect;
