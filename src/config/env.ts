import { config } from "dotenv";
import { cleanEnv, str, port } from "envalid";

config({
  path: ".env.local"
});

export const env = cleanEnv(process.env, {
  DATABASE_URL: str(),
  PORT: port({ default: 8080 })
});
