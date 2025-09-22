const winston = require("winston");
const process = require("process");
const path = require("path");

const logsFile = path.join(
  process.env.APPDATA,
  ".minecraft",
  "hycave",
  "latest.log"
);

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] (${level}): ${message}`;
    })
  ),
  transports: [new winston.transports.File({ filename: logsFile })],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(new winston.transports.Console());
}

logger.logsFile = logsFile;

module.exports = logger;
