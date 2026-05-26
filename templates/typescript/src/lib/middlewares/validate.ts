import { createErrorResponse } from "#lib/services/error.js";
import type { RequestHandler } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZodIssue, ZodTypeAny } from "zod";

export const validateRequestBody =
  (schema: ZodTypeAny): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.body);
    if (parsed.success) {
      req.body = parsed.data;
      return next();
    }
    const errorMessage = parsed.error.errors[0]?.message || "Validation Error";
    return createErrorResponse(res, parsed.error.errors, StatusCodes.BAD_REQUEST, errorMessage);
  };

export const validateRequestParams =
  (schema: ZodTypeAny): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (parsed.success) {
      req.params = parsed.data as typeof req.params;
      return next();
    }
    const data = parsed.error.errors.map((error: ZodIssue) => ({
      ...error,
      field: error.path.join("."),
    }));
    return createErrorResponse(res, data, StatusCodes.NOT_ACCEPTABLE, "Request params validation error");
  };

export const validateRequestQuery =
  (schema: ZodTypeAny): RequestHandler =>
  (req, res, next) => {
    const parsed = schema.safeParse(req.query);
    if (parsed.success) {
      req.query = parsed.data as typeof req.query;
      return next();
    }
    const data = parsed.error.errors.map((error: ZodIssue) => ({
      ...error,
      field: error.path.join("."),
    }));
    return createErrorResponse(res, data, StatusCodes.BAD_REQUEST, "Request query validation error");
  };
