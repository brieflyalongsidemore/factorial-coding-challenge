import { CategoriesController } from "controllers/categories.controller";
import App from "./app";
const app = new App([new CategoriesController()]);
app.listen();
