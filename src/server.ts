import App from "./app";
import { CategoriesController } from "services/categories/categories.controller";

const app = new App([new CategoriesController()]);
app.listen();
