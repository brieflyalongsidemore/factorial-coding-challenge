import { CreateCategoryPayload } from "./categories.validation";
import { categories, CategoryType } from "db/schema/categories";
import db from "db";

export class CategoriesService {
  public async create(payload: CreateCategoryPayload) {
    return db.insert(categories).values({ name: payload.name });
  }
  public async getAll(): Promise<CategoryType[]> {
    const res = await db.select().from(categories);
    return res;
  }
}
