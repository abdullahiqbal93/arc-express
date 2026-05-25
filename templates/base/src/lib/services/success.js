import { APIResponse, ResponseSchema } from "#lib/response/response.js";
import { StatusCodes } from "http-status-codes";
import { mainLogger } from "#lib/logger/winston.js";

export function createSuccessResponseForSwagger(data) {
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

export function createSuccessResponse(res, data, status = StatusCodes.OK, message = "Success") {
  mainLogger.info(`Success response sent: ${message}`);
  return res.status(status).send(APIResponse.success(message, data, status));
}
