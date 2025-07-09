import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import fs from "fs";
import path from "path";
import os from "os";

const logDir = path.join(os.homedir(), ".emsesp-mcp", "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, {
    recursive: true,
  });
}

const logLevel = process.env.LOG_LEVEL || "info";

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`),
  ),
  transports: [
    new DailyRotateFile({
      filename: path.join(logDir, "server-%DATE%.log"),
      datePattern: "YYYY-MM-DD",
      maxSize: "1m",
      maxFiles: "7d",
      zippedArchive: true,
    }),
    // Add console output for development/debugging
    // new winston.transports.Console({
    //   level: process.env.NODE_ENV === "production" ? "error" : logLevel,
    //   format: winston.format.combine(
    //     winston.format.colorize(),
    //     winston.format.simple()
    //   )
    // })
  ],
});

export default logger;
