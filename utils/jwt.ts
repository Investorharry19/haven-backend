import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response } from "express";

const JWT_SECRET = process.env.JWTSECRET;
if (!JWT_SECRET) {
  throw new Error("JWTSECRET is not set in environment variables");
}

export const signToken = (token: string, duration = 0) => {
  return jwt.sign(token, process.env.JWTSECRET as string, {
    expiresIn: duration,
  });
};

export function verifyToken<T extends JwtPayload>(token: string): T {
  const decoded = jwt.verify(token, JWT_SECRET!);
  if (typeof decoded === "string") {
    throw new jwt.JsonWebTokenError("Invalid token payload");
  }
  return decoded as T;
}

export const processRoleAuthorizationToken = (req: Request, res: Response) => {
  const { authorization } = req.headers;

  if (!authorization || authorization.length < 10) {
    return res.status(400).json({
      message: {
        name: "JsonWebTokenError",
        message: "invalid token",
      },
    });
  }

  const token = authorization.split("Bearer ")[1];
  const verifiedToken = verifyToken(token);
  return verifiedToken;
};
