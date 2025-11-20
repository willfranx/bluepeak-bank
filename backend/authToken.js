import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";

export const createAccessToken = (userid) => {
  return jwt.sign(
    { userid },
    process.env.ACCESS_SECRET,
    { expiresIn: "1m" }
  );
};

export const createRefreshToken = (userid, tokenId = randomUUID()) => {
  return jwt.sign(
    { userid, tokenId },
    process.env.REFRESH_SECRET,
    { expiresIn: "5m" }
  );
};
