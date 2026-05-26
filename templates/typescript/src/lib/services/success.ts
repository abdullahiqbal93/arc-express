import { APIResponse, ResponseSchema } from "#lib/response/response.js";
import type { Response } from "express";
import { StatusCodes } from "http-status-codes";
import type { ZodTypeAny } from "zod";
import { mainLogger } from "#lib/logger/winston.js";

export function createSuccessResponseForSwagger(data: ZodTypeAny) {
  return {
    [StatusCodes.OK]: {
      description: "Success response",
      content: {
        "application/json": {
          schema: ResponseSchema(data),
        },
      },
    },
  };
}

export function createSuccessResponse<TData>(
  res: Response,
  data: TData,
  status = StatusCodes.OK,
  message = "Success",
) {
  mainLogger.info(`Success response sent: ${message}`);
  return res.status(status).send(APIResponse.success(message, data, status));
}
