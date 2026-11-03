import { Response } from "express";

export const SendResponse = (
  res: Response,
  {
    success = true,
    statusCode = 200,
    message = "",
    data = null,
  }: {
    success?: boolean;
    statusCode?: number;
    message?: string;
    data?: any;
  },
) => {
  const payload: any = {
    success,
    data,
    message,
  };

  Object.keys(payload).forEach(
    (key) => payload[key] === null && delete payload[key],
  );

  return res.status(statusCode).json(payload);
};
