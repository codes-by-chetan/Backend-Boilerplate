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

const getLogFilePath = () =>
  path.join(logDirectory, `logs-${new Date().toISOString().slice(0, 10)}.html`);

const initializeLogFile = (filePath) => {
  if (fs.existsSync(filePath)) {
    return;
  }

  const date = new Date().toISOString().split("T")[0];
  fs.writeFileSync(
    filePath,
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Application Logs - ${date}</title>
  <style>
    body { font-family: monospace; background: #111827; color: #f9fafb; padding: 24px; }
    .timestamp { color: #9ca3af; }
    .info { color: #60a5fa; }
    .warn { color: #fbbf24; }
    .error { color: #f87171; }
    .debug { color: #c084fc; }
    .success { color: #4ade80; }
    .request { color: #22d3ee; }
    .meta { color: #d1d5db; }
  </style>
</head>
<body><pre>\n`,
    "utf8",
  );
};

let currentDate = new Date().toISOString().split("T")[0];
let logFilePath = getLogFilePath();
initializeLogFile(logFilePath);

const rotateLogFileIfNeeded = () => {
  const nextDate = new Date().toISOString().split("T")[0];
  if (nextDate === currentDate) {
    return;
  }

  currentDate = nextDate;
  logFilePath = getLogFilePath();
  initializeLogFile(logFilePath);
};

const writeToFile = (level, message, meta) => {
  rotateLogFileIfNeeded();

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta } : {}),
  };

  const htmlClass = level === "request" ? "request" : level;
  const htmlMeta = meta
    ? ` <span class="meta">${JSON.stringify(payload.meta, null, 2)}</span>`
    : "";

  fs.appendFileSync(
    logFilePath,
    `<span class="timestamp">${payload.timestamp}</span> <span class="${htmlClass}">[${level.toUpperCase()}]</span> ${message}${htmlMeta}\n`,
    "utf8",
  );
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
  request(message, meta) {
    if (shouldLog("info")) {
      baseLog("request", chalk.cyan, message, meta);
    }
  },
};

export default logger;
