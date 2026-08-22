import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./packages/database/schema.ts",
  out: "./packages/database/drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://placeholder:placeholder@localhost:5432/arkheon",
  },
  strict: true,
  verbose: true,
});
