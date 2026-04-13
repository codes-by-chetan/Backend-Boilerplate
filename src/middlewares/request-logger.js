import morgan from "morgan";

import logger from "../config/logger.js";

export const requestLogger = morgan(
  (tokens, req, res) =>
    [
      `[${req.requestId}]`,
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      `${tokens["response-time"](req, res)} ms`,
    ].join(" "),
  {
    stream: {
      write(message) {
        logger.info(message.trim());
      },
    },
  },
);
