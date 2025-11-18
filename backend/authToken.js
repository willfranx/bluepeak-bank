import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

export const createAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.ACCESS_SECRET,
    { expiresIn: "1m" }
  );
};

export const createRefreshToken = (userId, tokenId = randomUUID()) => {
  return jwt.sign(
    { userId, tokenId },
    process.env.REFRESH_SECRET,
    { expiresIn: "2m" }
  );
};
