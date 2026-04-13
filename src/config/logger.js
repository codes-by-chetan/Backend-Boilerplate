import chalk from "chalk";
import fs from "fs";
import path from "path";

import config from "./env.js";

const levels = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const logDirectory = path.join(process.cwd(), "logs");
fs.mkdirSync(logDirectory, { recursive: true });

const logFilePath = path.join(logDirectory, `app-${new Date().toISOString().slice(0, 10)}.log`);

const writeToFile = (level, message, meta) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  fs.appendFileSync(logFilePath, `${JSON.stringify(payload)}\n`, "utf8");
};

const formatMeta = (meta) => {
  if (!meta) {
    return "";
  }

  if (meta instanceof Error) {
    return `\n${meta.stack}`;
  }

  return `\n${JSON.stringify(meta, null, 2)}`;
};

const baseLog = (level, color, message, meta) => {
  const timestamp = new Date().toLocaleString();
  const consoleMessage = `${chalk.gray(timestamp)} ${color(level.toUpperCase())} ${message}`;

  console.log(`${consoleMessage}${formatMeta(meta)}`);
  writeToFile(level, message, meta);
};

const shouldLog = (targetLevel) => levels[targetLevel] >= levels[config.logLevel];

const logger = {
  debug(message, meta) {
    if (shouldLog("debug")) {
      baseLog("debug", chalk.magenta, message, meta);
    }
  },
  info(message, meta) {
    if (shouldLog("info")) {
      baseLog("info", chalk.blue, message, meta);
    }
  },
  success(message, meta) {
    if (shouldLog("info")) {
      baseLog("info", chalk.green, message, meta);
    }
  },
  warn(message, meta) {
    if (shouldLog("warn")) {
      baseLog("warn", chalk.yellow, message, meta);
    }
  },
  error(message, meta) {
    if (shouldLog("error")) {
      baseLog("error", chalk.red, message, meta);
    }
  },
};

export default logger;
