import "dotenv/config";
import { defineConfig, env } from "prisma/config";

const derivedDatabaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${encodeURIComponent(process.env.DB_USER || "postgres")}:${encodeURIComponent(process.env.DB_PASSWORD || "postgres")}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "5432"}/${process.env.DB_NAME || "backend_boilerplate"}`;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL ? env("DATABASE_URL") : derivedDatabaseUrl,
  },
});
