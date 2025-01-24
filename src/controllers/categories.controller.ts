import { Controller } from "interfaces/controller.interface";
import { Request, Response } from "express";
import { ProductService } from "services/product/product.service";
import { CartService } from "services/cart/cart.service";
import { OptionsService } from "services/options/options.service";
import { CategoriesService } from "services/categories/categories.service";

export class CategoriesController extends Controller {
  private categoriesService = new CategoriesService();

  constructor() {
    super("/categories");
    this.initializeRoutes();
  }

  protected initializeRoutes() {
    // this.router.get(`${this.path}`, this.getCategories);
    this.router.get(
      `${this.path}`,
      // validationMiddleware(createCategorySchema),
      this.getCartItems
    );
    this.router.post(`${this.path}/create`, this.createCartItem);
  }

  private getCategories = async (request: Request, response: Response) => {
    new ProductService().getAllProducts();
  };

  private getCartItems = async (request: Request, response: Response) => {
    new OptionsService().getPartOptionsWithRules();
  };

  private attachPartToProduct = async (request: Request, response: Response) => {
    new ProductService().attachOptionToProduct(request.body);
  };

  private createCartItem = async (request: Request, response: Response) => {
    new CartService().create(request.body);
  };

  private createCategory = async (request: Request, response: Response) => {
    await this.categoriesService.create(request.body);
    response.status(201).json({
      status: 201,
      code: "success"
    });
  };
}
