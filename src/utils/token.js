import crypto from "crypto";

import jwt from "jsonwebtoken";

import config from "../config/env.js";

const parseExpiryToMs = (value) => {
  if (/^\d+$/.test(value)) {
    return Number(value) * 1000;
  }

  const matches = value.match(/^(\d+)([smhd])$/);
  if (!matches) {
    throw new Error(`Unsupported JWT expiry format: ${value}`);
  }

  const amount = Number(matches[1]);
  const unit = matches[2];
  const map = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return amount * map[unit];
};

export const createAccessToken = (payload) =>
  jwt.sign(payload, config.jwt.accessSecret, { expiresIn: config.jwt.accessExpiresIn });

export const createRefreshToken = (payload) =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn });

export const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);

export const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

export const getRefreshExpiryDate = () =>
  new Date(Date.now() + parseExpiryToMs(config.jwt.refreshExpiresIn));
