import path from "path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Manually load environment variables since Prisma v6 skips .env loading when using this config file
dotenv.config();

export default defineConfig({
  schema: path.join(import.meta.dirname, "src/db/schema.prisma"),
});
