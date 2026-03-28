import { Router } from "express";
import { PerformanceDashboardData } from "../controllers/performance.js";
import { authMiddleware } from "../utils/authMiddleware.js";
const PerformanceRouter = Router();

PerformanceRouter.get(
  "/performance/dashboard-data",
  authMiddleware,
  PerformanceDashboardData,
);

export default PerformanceRouter;
