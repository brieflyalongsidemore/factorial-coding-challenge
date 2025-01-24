import { pgTable, varchar, uuid } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name")
});

export type CategoryType = typeof categories.$inferSelect;
