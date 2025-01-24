import db from "db";
import { and, eq, sql } from "drizzle-orm";
import { partOptions } from "db/schema/partOptions";
import { z } from "zod";
import { rules } from "db/schema/rules";
import { castArrayOfStringsToUUID } from "utils/db/castUUID";

export class RulesService {
  private async checkIfRuleAlreadyExist(payload: CreateRulePayload) {
    const { description: _, ...rulesFilters } = { ...payload };
    const payloadSearchValues = Object.keys(rulesFilters).map((k) =>
      //@ts-expect-error expecting partOption key
      eq(partOptions[k], payload[k])
    );
    const ruleExists = await db
      .select()
      .from(rules)
      .where(and(...payloadSearchValues));
    return !!ruleExists;
  }

  public async create(payload: CreateRulePayload) {
    const ruleExists = await this.checkIfRuleAlreadyExist(payload);
    if (ruleExists) throw new Error("rule-already-exists");

    return db.insert(rules).values({ ...payload });
  }

  public async validateCartOptionsRules(cartOptionsIds: string[]) {
    const castedOptions = castArrayOfStringsToUUID(cartOptionsIds);

    const violations = await db
      .select({
        violatingOptionId: partOptions.id,
        actionType: rules.actionType,
        description: rules.description
      })
      .from(rules)
      .leftJoin(partOptions, eq(partOptions.partId, rules.scopeId))
      .where(
        sql`
        rules.enabled = true
        AND (
          -- Check if optionsIds has a rule that disables the option
          (rules.action_type = 'disable'
            AND rules.condition_option_id = ANY(${castedOptions})
            AND rules.target_option_id = ANY(${castedOptions}))
            AND part_options.id = rules.target_option_id
          OR
          -- Check if optionsIds has a rule that only enables an option from a scope (e.g, wheels)
          -- and another option from that scope is selected
          (rules.action_type = 'only_enable'
            AND rules.condition_option_id = ANY(${castedOptions})
          AND rules.scope_id = ANY(
            SELECT part_id
            FROM part_options
            WHERE part_options.id = ANY(${castedOptions})
          )
          AND (

            (
              rules.target_option_id = ANY(${castedOptions})
              AND EXISTS (
                SELECT 1
                FROM part_options po
                WHERE po.part_id = rules.scope_id
                  AND po.id = ANY(${castedOptions})
                  AND po.id != rules.target_option_id
                  AND po.id != rules.condition_option_id
              )
            )
            OR (
              NOT rules.target_option_id = ANY(${castedOptions})
              AND EXISTS (
                SELECT 1
                FROM part_options po
                WHERE po.part_id = rules.scope_id
                  AND po.id = ANY(${castedOptions})
                  AND po.id != rules.condition_option_id
              )
            )
          )
          AND part_options.id = ANY(${castedOptions})
          AND part_options.id != rules.target_option_id
          )
        )
    `
      );

    return violations;
  }

  public async getPartOptionsWithRules(selectedOptionsIds: string[], partId: string) {
    const castedOptions = castArrayOfStringsToUUID(selectedOptionsIds);

    const optionRulesData = await db
      .select({
        id: partOptions.id,
        partId: partOptions.partId,
        name: partOptions.name,
        availability: partOptions.availability,
        basePrice: partOptions.basePrice,
        disabled: sql`
      CASE
        WHEN rules.enabled = true
             AND rules.action_type = 'disable'
             AND rules.target_option_id = part_options.id THEN true

             WHEN rules.enabled = true
             AND rules.action_type = 'only_enable'
             AND rules.scope_id = part_options.part_id
             AND rules.condition_option_id = ANY(${castedOptions})
             AND rules.target_option_id != part_options.id
             THEN true

        ELSE false
      END
    `,
        description: rules.description
      })
      .from(partOptions)
      .leftJoin(rules, eq(rules.scopeId, partOptions.partId))
      .where(and(eq(partOptions.partId, partId)));

    return optionRulesData;
  }

  public async getOptionRule(optionId: string) {
    const optionRulesData = await db
      .select()
      .from(rules)
      .where(and(eq(rules.conditionOptionId, optionId)));
    return optionRulesData;
  }
}

export const createRuleSchema = z.object({
  body: z.object({
    conditionOptionId: z.string().min(3),
    targetOptionId: z.string().min(3),
    actionType: z.string().min(3),
    scopeId: z.string().min(3),
    description: z.string()
  })
});

export type CreateRulePayload = z.infer<typeof createRuleSchema>["body"];
