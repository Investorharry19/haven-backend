export const SendResponse = (
  res,
  { success = true, statusCode = 200, message = "", data = null }
) => {
  const payload = {
    success,
    data,
    message,
  };

  Object.keys(payload).forEach(
    (key) => payload[key] === null && delete payload[key]
  );

  return res.status(statusCode).json(payload);
};
