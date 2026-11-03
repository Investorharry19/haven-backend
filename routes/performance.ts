import { Router } from "express";
import { PerformanceDashboardData } from "../controllers/performance.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
const PerformanceRouter = Router();

PerformanceRouter.get(
  "/performance/dashboard-data",
  authMiddleware,
  PerformanceDashboardData,
);

export default PerformanceRouter;
