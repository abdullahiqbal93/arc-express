import { APIResponse } from "#lib/response/response.js";
import { handleError } from "#lib/utils/error-handle.js";
import type { ErrorRequestHandler, Response } from "express";
import { StatusCodes } from "http-status-codes";

export function createErrorResponse(
  res: Response,
  data: unknown,
  status = StatusCodes.INTERNAL_SERVER_ERROR,
  message = "Error",
) {
  const errorResponse = APIResponse.failure(message, data, status);
  if (process.env.NODE_ENV === "development" && data && typeof data === "object" && "stack" in data) {
    errorResponse.stack = data.stack;
  }
  return res.status(status).send(errorResponse);
}

export const expressErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const error = handleError(err);
  const status = typeof err?.status === "number" ? err.status : StatusCodes.INTERNAL_SERVER_ERROR;
  const message = typeof err?.message === "string" ? err.message : "Internal Server Error";
  createErrorResponse(res, error, status, message);
};
