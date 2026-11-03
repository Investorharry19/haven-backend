export {};

declare global {
  namespace Express {
    interface Request {
      authBearerId?: string;
      Id?: string;
    }
  }
}
