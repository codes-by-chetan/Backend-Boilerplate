import httpStatus from "http-status";
import Joi from "joi";

import ApiError from "../utils/ApiError.js";
import pick from "../utils/pick.js";

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ["params", "query", "body"]);
  const object = pick(req, Object.keys(validSchema));
  const { error, value } = Joi.compile(validSchema)
    .prefs({ abortEarly: false, errors: { label: "key" } })
    .validate(object);

  if (error) {
    const message = error.details.map((detail) => detail.message).join(", ");
    next(new ApiError(httpStatus.BAD_REQUEST, message));
    return;
  }

  Object.assign(req, value);
  next();
};

export default validate;
