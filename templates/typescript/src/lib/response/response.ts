import { StatusCodes } from "http-status-codes";
import { z, type ZodTypeAny } from "zod";
import { mainLogger } from "#lib/logger/winston.js";

export class APIResponse<TData = unknown> {
  success: boolean;
  message: string;
  data: TData;
  statusCode: number;
  stack?: unknown;

  constructor(success: boolean, message: string, data: TData, statusCode: number) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  static success<TData>(message: string, data: TData, statusCode = StatusCodes.OK) {
    mainLogger.info(`Success response: ${message}`);
    return new APIResponse(true, message, data, statusCode);
  }

  static failure<TData>(message: string, data: TData, statusCode: number) {
    mainLogger.error(`Failure response: ${message}`);
    return new APIResponse(false, message, data, statusCode);
  }
}

export const ResponseSchema = (dataSchema: ZodTypeAny) =>
  z.object({
    success: z.boolean(),
    message: z.string(),
    data: dataSchema.optional(),
    statusCode: z.number(),
  });
