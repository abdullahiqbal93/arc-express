import winston from "winston";
import { getDebugLog, getErrorLog, getInfoLog, getSuccessLog, getWarnLog, levels } from "./helper.js";
import { LEVEL, MESSAGE, SPLAT } from "triple-beam";

const prettyPrintWithColor = () =>
  winston.format.printf((message) => {
    const stripped = Object.assign({}, message);

    delete stripped[LEVEL];
    delete stripped[MESSAGE];
    delete stripped[SPLAT];

    if (stripped.method === "GET" || stripped.method === "DELETE") {
      delete stripped.body;
    }
    switch (stripped.level) {
      case "error":
        return getErrorLog(stripped);
      case "success":
        return getSuccessLog(stripped);
      case "warn":
        return getWarnLog(stripped);
      case "debug":
        return getDebugLog(stripped);
      default:
        return getInfoLog(stripped);
    }
  });

const format = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  prettyPrintWithColor(),
);

const transports = [new winston.transports.Console({ level: "debug" })];

// File transports for production
if (process.env.NODE_ENV === "production" || process.env.LOG_TO_FILE === "true") {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      level: "info",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
    }),
  );
}

export const mainLogger = winston.createLogger({
  levels,
  transports,
  format,
});
