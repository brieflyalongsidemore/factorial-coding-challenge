import { pgTable, varchar, uuid, boolean } from "drizzle-orm/pg-core";
import { partOptions } from "./partOptions";
import { parts } from "./parts";
import { relations } from "drizzle-orm";

export const rules = pgTable("rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  conditionOptionId: uuid("condition_option_id")
    .notNull()
    .references(() => partOptions.id), // The "if" part of the rule
  actionType: varchar("action_type").notNull(), // Either "disable" or "only_enable"
  targetOptionId: uuid("target_option_id")
    .notNull()
    .references(() => partOptions.id), // The "then" part of the rule
  enabled: boolean().default(false),
  scopeId: uuid("scope_id")
    .notNull()
    .references(() => parts.id),
  description: varchar("description")
});

export const rulesRelations = relations(rules, ({ one }) => ({
  conditionOption: one(partOptions, {
    fields: [rules.conditionOptionId],
    references: [partOptions.id],
    relationName: "rules_conditionOption"
  }),

  targetOption: one(partOptions, {
    fields: [rules.targetOptionId],
    references: [partOptions.id],
    relationName: "rules_targetOption"
  }),

  scope: one(parts, {
    fields: [rules.scopeId],
    references: [parts.id],
    relationName: "rules_scope"
  })
}));

export type RulesType = typeof rules.$inferSelect;
