import { StatusCodes } from "http-status-codes";
import { z } from "zod";
import { mainLogger } from "../logger/winston.js";

export class APIResponse {
  constructor(success, message, data, statusCode) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success(message, data, statusCode = StatusCodes.OK) {
    mainLogger.info(`Success response: ${message}`);
    return new APIResponse(true, message, data, statusCode);
  }

  static failure(message, data, statusCode) {
    mainLogger.error(`Failure response: ${message}`);
    return new APIResponse(false, message, data, statusCode);
  }
}

export const ResponseSchema = (dataSchema) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional(),
    statusCode: z.number(),
  });
