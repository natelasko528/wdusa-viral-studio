import type { Prisma } from "@prisma/client";

/** Coerce arbitrary JSON-like values for Prisma `Json` / `InputJsonValue` fields. */
export function asPrismaInputJson(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
