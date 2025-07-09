import jwt from "jsonwebtoken";

export function authMiddleware(req, res, next) {
  const { authorization } = req.headers;

  if (
    !authorization ||
    !authorization.startsWith("Bearer ") ||
    authorization.length < 10
  ) {
    return res.status(400).json({ message: "Invalid token in header" });
  }

  const token = authorization.split("Bearer ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWTSECRET);
    req.authBearerId = decoded.Id;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
