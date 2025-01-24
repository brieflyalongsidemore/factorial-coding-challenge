import db from "db";
import { eq, inArray, or, and } from "drizzle-orm";
import { z } from "zod";
import { priceCombination } from "db/schema/priceComb";
import { partOptions } from "db/schema/partOptions";

export class PriceService {
  public async getPricesComb(optionId: string) {
    return db
      .select()
      .from(priceCombination)
      .where(
        or(
          eq(priceCombination.optionToAdjustId, optionId),
          eq(priceCombination.triggerOptionId, optionId)
        )
      );
  }

  public async addPriceCombForOptions(payload: CreatePriceCombPayload) {
    return db.insert(priceCombination).values(payload);
  }

  public async calculateTotalPrice(options: string[]) {
    const optionsData = await db.select().from(partOptions).where(inArray(partOptions.id, options));

    const priceComb = await db
      .select()
      .from(priceCombination)
      .where(
        and(
          inArray(priceCombination.optionToAdjustId, options),
          inArray(priceCombination.triggerOptionId, options)
        )
      );

    const total = optionsData.reduce((a, b) => {
      const comb = priceComb.find((option) => option.optionToAdjustId === b.id);
      if (comb?.priceDiff) return comb.priceDiff + a;

      return a + b.basePrice;
    }, 0);

    return total;
  }
}

export const createPriceComb = z.object({
  body: z.object({
    optionToAdjustId: z.string().min(3),
    triggerOptionId: z.string(),
    priceDiff: z.number(),
    reason: z.string()
  })
});

export type CreatePriceCombPayload = z.infer<typeof createPriceComb>["body"];
