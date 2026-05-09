import { v4 as uuidv4 } from "uuid";

import { runWithRequestStore } from "../lib/request-store.js";

const requestContext = (req, res, next) => {
  req.requestId = req.headers["x-request-id"] || uuidv4();
  res.setHeader("x-request-id", req.requestId);
  runWithRequestStore(
    {
      requestId: req.requestId,
      ip: req.ip,
      origin: req.headers.origin || "Unknown",
      user: null,
    },
    () => next(),
  );
};

export default requestContext;
