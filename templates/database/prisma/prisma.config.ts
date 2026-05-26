import path from "path";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: path.join(import.meta.dirname, "src/db/schema.prisma"),
  envFilePath: path.join(import.meta.dirname, ".env"),
});
