// src/middleware/errorHandler.ts
// Global Express error handler — must be the LAST middleware registered in server.ts.
// Maps AppError subclasses to HTTP responses using standard response shapes.

import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/errors";
import { sendError } from "../lib/response";
import { logger } from "../utils/logger";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // 1. Zod validation errors
  if (err instanceof ZodError) {
    sendError(
      res,
      "Validation failed",
      422,
      "VALIDATION_ERROR",
      err.flatten().fieldErrors,
    );
    return;
  }

  // 2. Known domain errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code);
    return;
  }

  // 3. Unknown errors — log and return generic 500
  logger.error({ err }, "❌ Unhandled internal error:");
  
  // Do not expose raw internal messages (like DB schema errors) to the client
  sendError(res, "An unexpected internal server error occurred.", 500, "INTERNAL_ERROR");
}

export { AppError };
