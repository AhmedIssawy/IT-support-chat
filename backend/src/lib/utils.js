import jwt from "jsonwebtoken";
import { ENV } from "./env.js";

export const generateToken = (userId, res) => {
  const { JWT_SECRET } = ENV;
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const token = jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("__Security-auth", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, 
    httpOnly: true, 
    sameSite: "None", 
    secure: String(ENV.NODE_ENV) === "development" ? false : true,
  });

  return token;
};

