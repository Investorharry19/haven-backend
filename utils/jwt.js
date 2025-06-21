import jwt from "jsonwebtoken";

export const signToken = (token, duration = null) => {
  return jwt.sign(token, process.env.JWTSECRET, { expiresIn: duration });
};

export const verifyToken = (token) => {
  return jwt.verify(token, "haven");
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

const token = verifyToken(
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9wZXJ0eUlkIjoiNjg1NDA5MzE5YTg0ODk5OWM2NjhjNWEyIiwibGFuZGxvcmRJZCI6IjY4NTBhYTZmNGZlYmVkNmIzMjczMjM3YSIsInByb3BlcnR5RGV0YWlscyI6eyJfaWQiOiI2ODU0MDkzMTlhODQ4OTk5YzY2OGM1YTIiLCJ1c2VySWQiOiI2ODRkOGY4NjI1OWFhMGYxYmU2MjliM2UiLCJwcm9wZXJ0eU5hbWUiOiJuZXcgb3JsZWFucyBlc3RhdGUiLCJwcm9wZXJ0eUxvY2F0aW9uIjoic2FuIGZyYW5jaXNvIGJheSBhcmVhIiwiY291bnRyeSI6InVuaXRlZCBzdGF0ZXMiLCJudW1iZXJPZlVuaXRzIjoyOCwicHJvcGVydHlUeXBlIjoiZXN0YXRlIiwicHJvcGVydHlJbWFnZXNVcmwiOiJodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kdW93b2N2ZWQvaW1hZ2UvdXBsb2FkL3YxNzUwMzM3ODQwL21kYXd1NjlhYmtyMWsxZ2NuMzdoLmpwZyIsInByb3BlcnR5SW1hZ2VzSWQiOiJtZGF3dTY5YWJrcjFrMWdjbjM3aCIsImRlc2NyaXB0aW9uIjoidGhpcyBpcyBhcHJvcGVydHkgbG9jYXRlZCBpbiBzYW5mcmFuY2lzY28gYmF5IGFyZWEgaW4gY2FsaWZvcm5pYSIsIm9jY3VwaWVkVW5pdHMiOjAsInBlbmRpbmdVbml0cyI6MCwiY3JlYXRlZEF0IjoiMjAyNS0wNi0xOVQxMjo1NzoyMS4zMDVaIiwidXBkYXRlZEF0IjoiMjAyNS0wNi0xOVQxMjo1NzoyMS4zMDVaIiwiX192IjowfSwidXNlZExlYXNlVG9rZW4iOnsianRpIjoiMWY0MjQ3YjMtNjg3OS00MmIxLWFiMjEtMzNjMGZmY2M4Y2E4IiwidXNlZCI6ZmFsc2UsIl9pZCI6IjY4NTU1YTM1ODYxMTg4OGNmMGEwNWFhOSIsImNyZWF0ZWRBdCI6IjIwMjUtMDYtMjBUMTI6NTU6MTcuNzk2WiIsIl9fdiI6MH0sImlhdCI6MTc1MDQyNDExNywiZXhwIjoxNzUwNDY3MzE3fQ.PyIiBXvneOSvF2A7TpwdgZ2EazxBWbh3pFc_a6SDNOU"
);
console.log(token);
