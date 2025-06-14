import jwt from "jsonwebtoken";

export const signToken = (token, duration = null) => {
  return jwt.sign(token, process.env.JWTSECRET, { expiresIn: duration });
};

export const verifyToken = (token) => {
  return jwt.verify(token);
};

export const processRoleAuthorizationToken = (req, res) => {
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
