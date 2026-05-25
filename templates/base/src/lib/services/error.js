import { APIResponse } from "#lib/response/response.js";
import { handleError } from "#lib/utils/error-handle.js";
import { StatusCodes } from "http-status-codes";

export function createErrorResponse(res, data, status = StatusCodes.INTERNAL_SERVER_ERROR, message = "Error") {
  const errorResponse = APIResponse.failure(message, data, status);
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = data?.stack;
  }
  return res.status(status).send(errorResponse);
}

export const expressErrorHandler = (err, _req, res, _next) => {
  const error = handleError(err);
  const status = err.status || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Internal Server Error';
  createErrorResponse(res, error, status, message);
};
