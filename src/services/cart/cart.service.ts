import { z } from "zod";
import db from "db";
import { eq, inArray, sql } from "drizzle-orm";
import { products } from "db/schema/products";

import { partOptions } from "db/schema/partOptions";
import { cart, cartOptions } from "db/schema/cart";
import { PriceService } from "services/price/price.service";
import { ProductService } from "services/product/product.service";
import { RulesService } from "services/rules/rules.service";

export class CartService {
  private priceService = new PriceService();
  private productService = new ProductService();
  private rulesService = new RulesService();

  private async checkIfOptionsValid(options: string[]) {
    const isValid = await db.select().from(partOptions).where(inArray(partOptions.id, options));
    return !!isValid.length;
  }

  private async checkIfProductExists(productId: string) {
    const isValid = await db.select().from(products).where(eq(products.id, productId));
    return !!isValid.length;
  }

  public async create(payload: AddToCartSchema) {
    const isProductValid = await this.checkIfProductExists(payload.productId);

    if (!isProductValid) throw new Error("invalid-productId");

    const options =
      payload.options || (await this.productService.getProductOptionsIds(payload.productId));

    const isCartOptionsValid = await this.checkIfOptionsValid(options);

    if (!isCartOptionsValid) throw new Error("invalid-options");

    const violations = await this.rulesService.validateCartOptionsRules(options);

    if (violations.length)
      throw new Error(
        JSON.stringify({ code: "rules-violations", data: JSON.stringify(violations) })
      );

    const [cartInitialData] = await db
      .insert(cart)
      .values({ ...payload })
      .returning({
        id: cart.id
      });

    const cartOptionsData = options.map((optionId) => ({
      cartId: cartInitialData.id,
      optionId
    }));

    return db.insert(cartOptions).values(cartOptionsData);
  }

  public async getCartItems() {
    const cartItems = await db
      .select({
        id: cart.id,
        productId: cart.productId,
        options: sql<
          {
            id: string;
            name: string;
            basePrice: number;
          }[]
        >`array_agg(json_build_object(
            'id', ${partOptions.id},
            'name', ${partOptions.name},
            'basePrice', ${partOptions.basePrice}
          ))`.as("options")
      })
      .from(cart)
      .innerJoin(cartOptions, eq(cart.id, cartOptions.cartId))
      .innerJoin(partOptions, eq(cartOptions.optionId, partOptions.id))
      .groupBy(cart.id, cart.productId);

    const cartItemsWithTotal = await Promise.all(
      cartItems.map(async (item) => {
        const cartOptionsIds = item.options.map((option) => option.id);
        const totalPrice = await this.priceService.calculateTotalPrice(cartOptionsIds);
        return {
          ...item,
          totalPrice
        };
      })
    );

    return cartItemsWithTotal;
  }
}

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().min(3),
    options: z.array(z.string())
  })
});

export type AddToCartSchema = z.infer<typeof addToCartSchema>["body"];
