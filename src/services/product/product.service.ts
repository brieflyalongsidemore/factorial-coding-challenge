import { z } from "zod";
import db from "db";
import { and, eq, sql } from "drizzle-orm";
import { products } from "db/schema/products";
import { productPresets } from "db/schema/presets";

import { PartsService } from "services/parts/parts.service";
import { partOptions } from "db/schema/partOptions";
import { priceCombination } from "db/schema/priceComb";

export class ProductService {
  private partsService = new PartsService();

  public async create(payload: CreateProductPayload) {
    return db.insert(products).values({ ...payload });
  }

  private async checkIfOptionIsAttachedToProduct(optionId: string, productId: string) {
    const presets = await db
      .select()
      .from(productPresets)
      .where(
        and(eq(productPresets.partOptionId, optionId), eq(productPresets.productId, productId))
      );
    return !!presets.length;
  }

  private async checkIfOptionCanBePairedWithPart(optionId: string, partId: string) {
    const options = await db
      .select()
      .from(partOptions)
      .where(and(eq(partOptions.id, optionId), eq(partOptions.partId, partId)));

    return !!options.length;
  }

  public async attachOptionToProduct(payload: AttachOptionPayload) {
    const isOptionPairAble = await this.checkIfOptionCanBePairedWithPart(
      payload.optionId,
      payload.partId
    );

    if (!isOptionPairAble) throw new Error("cannot-pair-option-with-part");
    const isOptionAlreadyAttached = await this.checkIfOptionIsAttachedToProduct(
      payload.optionId,
      payload.productId
    );
    if (isOptionAlreadyAttached) throw new Error("option-already-attached-to-product");
    return db.insert(productPresets).values({
      partId: payload.partId,
      partOptionId: payload.optionId,
      productId: payload.productId
    });
  }

  public async getAllProducts() {
    return db
      .select({
        id: products.id,
        name: products.name,
        imageURL: products.imageURL,
        categoryId: products.categoryId,
        price: sql<number>`
        SUM(
          CASE
          WHEN "price_combination"."priceDiff" IS NOT NULL AND "price_combination"."priceDiff" != 0
            THEN "price_combination"."priceDiff"
            ELSE "part_options"."base_price"
          END
        )`
      })
      .from(products)
      .innerJoin(productPresets, eq(products.id, productPresets.productId))
      .innerJoin(partOptions, eq(partOptions.id, productPresets.partOptionId))
      .leftJoin(priceCombination, eq(partOptions.id, priceCombination.optionToAdjustId))
      .groupBy(products.id, products.name, products.imageURL, products.categoryId);
  }

  public async getProductById(productId: string) {
    return db.select().from(products).where(eq(products.id, productId));
  }

  public async getProductOptions(productId: string) {
    const options = await db
      .select()
      .from(productPresets)
      .where(eq(productPresets.productId, productId));
    const optionsArray = options.map((preset) => preset.partOptionId);
    return optionsArray;
  }

  public async getFormattedProductComposition(
    productId: string = "9983556a-fbad-4470-b729-ce2f702b8e16",
    productCategoryId: string = "6013bf2b-4a8a-48ee-9a91-8a5fbbe99307"
  ) {
    const productOptions = await db
      .select({
        id: products.id,
        presetId: productPresets.id,
        categoryId: products.categoryId,
        partId: productPresets.partId,
        option: {
          id: partOptions.id,
          name: partOptions.name,
          basePrice: partOptions.basePrice,
          availability: partOptions.availability
        }
      })
      .from(products)
      .innerJoin(productPresets, eq(productPresets.productId, productId))
      .innerJoin(partOptions, eq(productPresets.partOptionId, partOptions.id));

    const categoryParts = await this.partsService.getCategoryParts(productCategoryId);

    const partsWithOptions = categoryParts.map(({ categoryId: _, ...part }) => {
      const partOptions = productOptions
        .filter((option) => option.partId === part.id)
        .map((p) => p.option);
      return {
        ...part,
        options: partOptions
      };
    });

    return partsWithOptions;
  }
}

export const attachOptionSchema = z.object({
  body: z.object({
    optionId: z.string().min(3),
    productId: z.string().min(3),
    partId: z.string().min(3)
  })
});

export const createProduct = z.object({
  body: z.object({
    name: z.string().min(3),
    categoryId: z.string().min(3)
  })
});

export type AttachOptionPayload = z.infer<typeof attachOptionSchema>["body"];
export type CreateProductPayload = z.infer<typeof createProduct>["body"];
