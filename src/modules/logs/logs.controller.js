import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/async-handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logsDirectory = path.join(__dirname, "../../../logs");

const getLogFilePath = (date) => path.join(logsDirectory, `logs-${date}.html`);
const safeLogFileNamePattern = /^logs-\d{4}-\d{2}-\d{2}\.html$/;

const getValidatedFilePath = (fileName) => {
  if (!safeLogFileNamePattern.test(fileName)) {
    throw new ApiError(400, "Invalid log file name");
  }

  return path.join(logsDirectory, fileName);
};

export const getAllLogs = asyncHandler(async (req, res) => {
  if (!fs.existsSync(logsDirectory)) {
    res.status(200).json({ logs: [] });
    return;
  }

  const logs = fs
    .readdirSync(logsDirectory)
    .filter((file) => safeLogFileNamePattern.test(file))
    .map((file) => {
      const filePath = path.join(logsDirectory, file);
      const stats = fs.statSync(filePath);

      return {
        fileName: file,
        size: stats.size,
        updatedAt: stats.mtime.toISOString(),
      };
    })
    .sort((left, right) => right.fileName.localeCompare(left.fileName));

  res.status(200).json({ logs });
});

export const getLogByFileName = asyncHandler(async (req, res) => {
  const { fileName } = req.params;
  const filePath = getValidatedFilePath(fileName);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Log file not found");
  }

  res.status(200).send(fs.readFileSync(filePath, "utf8"));
});

export const getLogsByDate = asyncHandler(async (req, res) => {
  const { date } = req.params;
  const filePath = getLogFilePath(date);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Log file not found");
  }

  res.status(200).send(fs.readFileSync(filePath, "utf8"));
});

export const getRecentLogs = asyncHandler(async (req, res) => {
  const date = new Date().toISOString().split("T")[0];
  const filePath = getLogFilePath(date);

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, "Log file not found");
  }

  res.status(200).send(fs.readFileSync(filePath, "utf8"));
});
