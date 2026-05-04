// src/middleware/validate.ts
// Zod validation middleware factory.
// Usage: router.post('/', validate(mySchema), controller)

import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { sendError } from "../lib/response";

type Target = "body" | "query" | "params";

/**
 * Returns middleware that validates req[target] against the given Zod schema.
 * On success, the parsed (coerced/transformed) data replaces req[target].
 * On failure, responds 422 with field-level errors.
 */
export function validate(schema: ZodSchema, target: Target = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      sendError(
        res,
        "Validation failed",
        422,
        "VALIDATION_ERROR",
        result.error.flatten().fieldErrors
      );
      return;
    }

    // Replace with parsed/coerced data
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}
