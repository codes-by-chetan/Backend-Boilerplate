import Joi from "joi";

export const registerValidation = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(120).required(),
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

export const loginValidation = {
  body: Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).max(128).required(),
  }),
};

export const refreshValidation = {
  body: Joi.object({
    refreshToken: Joi.string().optional(),
  }),
};
