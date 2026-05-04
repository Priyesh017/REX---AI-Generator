// src/lib/response.ts
// Standardized API response helpers.
// Every controller must use these — no ad-hoc res.json() shapes.

import { Response } from "express";

/** Standard success response */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
): void {
  res.status(statusCode).json(meta ? { data, meta } : { data });
}

/** Standard error response */
export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  code = "INTERNAL_ERROR",
  details?: unknown
): void {
  const body: Record<string, unknown> = { error: message, code };
  if (details !== undefined) body.details = details;
  res.status(statusCode).json(body);
}

/** Common error shortcuts */
export const Response400 = (res: Response, msg: string, details?: unknown) =>
  sendError(res, msg, 400, "BAD_REQUEST", details);

export const Response401 = (res: Response, msg = "Unauthorized") =>
  sendError(res, msg, 401, "UNAUTHORIZED");

export const Response403 = (res: Response, msg = "Forbidden") =>
  sendError(res, msg, 403, "FORBIDDEN");

export const Response404 = (res: Response, msg = "Not found") =>
  sendError(res, msg, 404, "NOT_FOUND");

export const Response409 = (res: Response, msg: string) =>
  sendError(res, msg, 409, "CONFLICT");

export const Response422 = (res: Response, msg: string, details?: unknown) =>
  sendError(res, msg, 422, "VALIDATION_ERROR", details);

export const Response500 = (res: Response, msg = "Internal server error") =>
  sendError(res, msg, 500, "INTERNAL_ERROR");
