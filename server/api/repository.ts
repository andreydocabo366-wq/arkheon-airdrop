import { PostgresRepository } from "../../packages/database/repository";
import type { DataRepository } from "../domain/types";
import type { RuntimeEnv } from "../runtime/env";
import { serviceUnavailable } from "./errors";

export function repositoryFromEnv(env: RuntimeEnv): DataRepository {
  if (!env.DATABASE_URL?.startsWith("postgres")) throw serviceUnavailable();
  return new PostgresRepository(env.DATABASE_URL);
}
