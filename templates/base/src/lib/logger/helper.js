import { inspect } from "node:util";
import { mainLogger } from "./winston.js";
import { TZDate } from "@date-fns/tz";
import chalk from "chalk";
import { format as dateFormat } from "date-fns";
import morgan from "morgan";
import { isUnicodeSupported } from "./unicode-support.js";

export const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  success: 4,
  debug: 5,
};

export const logFormat = `{
    "method": ":method",
    "url": ":url",
    "status": ":status",
    "responseTime": ":response-time ms",
    "body": :body,
    "query": :query,
    "params": :params,
    "remote": "::remote-addr",
    "agent":":user-agent",
    "validation": :validation_errors
}`;

export const parseMorganString = (message) => {
  try {
    return JSON.parse(message.trim());
  } catch (error) {
    if (error instanceof Error) {
      return { message: "Error parsing morgan message", level: "error", stack: error.stack, name: error.name };
    }
    return { message: "Error parsing morgan message", level: "error" };
  }
};

export const extractRequestBody = (request) =>
  request.method === "POST" || request.method === "PUT" ? JSON.stringify(request.body) : "null";

export const extractRequestQuery = (request) => JSON.stringify(request.query);
export const extractRequestParams = (request) => JSON.stringify(request.params);

export const extractValidationErrors = (request) =>
  request.headers.validation_errors ? request.headers.validation_errors : "{}";

export const streamFunc = () => ({
  write: (message) => {
    const jsonMessage = parseMorganString(message);
    if (jsonMessage.level === "error" || Number.parseInt(jsonMessage.status) > 399) {
      return mainLogger.error("HTTP ERROR", jsonMessage);
    }
    return mainLogger.http("HTTP SUCCESS", { ...jsonMessage, level: "success" });
  },
});

morgan.token("body", extractRequestBody);
morgan.token("query", extractRequestQuery);
morgan.token("params", extractRequestParams);
morgan.token("validation_errors", extractValidationErrors);

export function fillWithPad(withString, length = 12, pad = " ") {
  const total = withString.length;
  const remaining = length > total + 1 ? length - total : 1;
  return `${pad}${withString}${pad.repeat(remaining)}`;
}

export const isNotEmpty = (obj) => Object.keys(obj).length > 0;

export const getSymbol = (unicode, fallback = "", pad = "") =>
  isUnicodeSupported() ? `${pad}${unicode}${pad}` : fallback ? `${pad}${fallback}${pad}` : pad;

export const getSegment = (separator = chalk.bgBlueBright.whiteBright, segment = chalk.bgGray.whiteBright) =>
  (message, pad = " ") => segment(`${pad}${message}${pad}`) + separator(pad);

export const prettyPrintMessage = (obj, segment, fill, message) => {
  if (isNotEmpty(obj)) {
    return `${segment(`DETAILS ${getSymbol("▼", "=>")}`)} \n ${inspect(obj, { sorted: true, breakLength: 1, depth: 7 })}\n${fill(fillWithPad(message))}${segment(fillWithPad(`DETAILS END ${getSymbol("▲")}`, 24))}`;
  }
  return "";
};

export const getMessageBuilder =
  (segment, titleSegment) =>
  ({ timestamp, message, level, ...rest }) =>
    titleSegment(fillWithPad(level.toUpperCase())) +
    segment(dateFormat(new TZDate(timestamp, Intl.DateTimeFormat().resolvedOptions().timeZone), " MMM do iii hh:mm::ss SSS aa  OOO ")) +
    segment(`${fillWithPad(`[${message}]`, 16)} `) +
    prettyPrintMessage(rest, segment, titleSegment, level.toUpperCase());

const errorSegmentTitle = getSegment(chalk.bgRed.whiteBright, chalk.bgRed.whiteBright);
const errorSegment = getSegment(chalk.bgRed.whiteBright);

const infoSegmentTitle = getSegment(chalk.bgBlueBright.whiteBright, chalk.bgBlueBright.black);
const infoSegment = getSegment(chalk.bgBlueBright.whiteBright);

const successSegmentTitle = getSegment(chalk.bgGreenBright.whiteBright, chalk.bgGreenBright.black);
const successSegment = getSegment(chalk.bgGreenBright.whiteBright);

const warnSegmentTitle = getSegment(chalk.bgYellowBright.whiteBright, chalk.bgYellowBright.black);
const warnSegment = getSegment(chalk.bgYellowBright.whiteBright);

const debugSegmentTitle = getSegment(chalk.bgWhiteBright.black, chalk.bgWhiteBright.black);
const debugSegment = getSegment(chalk.bgWhiteBright.black);

export const getErrorLog = getMessageBuilder(errorSegment, errorSegmentTitle);
export const getSuccessLog = getMessageBuilder(successSegment, successSegmentTitle);
export const getInfoLog = getMessageBuilder(infoSegment, infoSegmentTitle);
export const getWarnLog = getMessageBuilder(warnSegment, warnSegmentTitle);
export const getDebugLog = getMessageBuilder(debugSegment, debugSegmentTitle);
