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
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcm9wZXJ0eUlkIjoiNjg1NDA5YTM5YTg0ODk5OWM2NjhjNWE0IiwibGFuZGxvcmRJZCI6IjY4NTBhYTZmNGZlYmVkNmIzMjczMjM3YSIsInByb3BlcnR5RGV0YWlscyI6eyJfaWQiOiI2ODU0MDlhMzlhODQ4OTk5YzY2OGM1YTQiLCJ1c2VySWQiOiI2ODRkOGY4NjI1OWFhMGYxYmU2MjliM2UiLCJwcm9wZXJ0eU5hbWUiOiJhYmR1bGxhaCdzIGNvdXJ0IGltYWdlIiwicHJvcGVydHlMb2NhdGlvbiI6ImJhbG9ndW4gbWkiLCJjb3VudHJ5IjoiY2FuYWRhIiwibnVtYmVyT2ZVbml0cyI6MzAsInByb3BlcnR5VHlwZSI6ImhvdXNlIiwicHJvcGVydHlJbWFnZXNVcmwiOiJodHRwczovL3Jlcy5jbG91ZGluYXJ5LmNvbS9kdW93b2N2ZWQvaW1hZ2UvdXBsb2FkL3YxNzUwMzM3OTU1L3dxcTZhcmo1b3pieWtxMGU0ZndtLnBuZyIsInByb3BlcnR5SW1hZ2VzSWQiOiJ3cXE2YXJqNW96YnlrcTBlNGZ3bSIsImRlc2NyaXB0aW9uIjoiIiwib2NjdXBpZWRVbml0cyI6MCwicGVuZGluZ1VuaXRzIjowLCJjcmVhdGVkQXQiOiIyMDI1LTA2LTE5VDEyOjU5OjE1LjY2OVoiLCJ1cGRhdGVkQXQiOiIyMDI1LTA2LTE5VDEyOjU5OjE1LjY2OVoiLCJfX3YiOjB9LCJ1c2VkTGVhc2VUb2tlbiI6eyJqdGkiOiI3MmRhNGViMy1iMGE5LTQ4YmMtODY2MS01NTE3NTUyMGMzM2QiLCJ1c2VkIjpmYWxzZSwiX2lkIjoiNjg1NmM4MDExODRlOTUzZGEzZjAxMjI5IiwiY3JlYXRlZEF0IjoiMjAyNS0wNi0yMVQxNDo1NjowMS45MThaIiwiX192IjowfSwiaWF0IjoxNzUwNTE3NzYyLCJleHAiOjE3NTA1NjA5NjJ9.1-ncX7BtbGTu_FHzQPJ3ltuVL5I18sODyhnfnbO57h4"
);
console.log(token);
