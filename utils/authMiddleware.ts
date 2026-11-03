import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { CustomJwtPayload } from "../types/jwt.ts";
import { verifyToken } from "./jwt.ts";

const JWT_SECRET = process.env.JWTSECRET;
if (!JWT_SECRET) {
  throw new Error("JWTSECRET is not set in environment variables");
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return res.status(400).json({ message: "Invalid token in header" });
  }

  const token = authorization.slice("Bearer ".length);

  try {
    const decoded = verifyToken(token);

    if (typeof decoded === "string" || typeof decoded.Id !== "string") {
      return res.status(401).json({ message: "Invalid token payload" });
    }

    req.authBearerId = decoded.Id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
