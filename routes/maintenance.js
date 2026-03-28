import { Router } from "express";
import upload from "../utils/multer.js";

import {
  DashboardAddMaintenance,
  DashboardApproveMaintnance,
  DashboardDeletMaintenance,
  DashboardGetALlMaintenance,
  TenantAddMaintenance,
  TenantDeleteMaintenance,
  TenantGetMaintenance,
} from "../controllers/maintenance.js";
import { authMiddleware } from "../utils/authMiddleware.js";
const HavenMaintenanceRouter = Router();

//landlord get maintenance
HavenMaintenanceRouter.get(
  "/dashboard/get-all-maintenance",
  authMiddleware,
  DashboardGetALlMaintenance,
);

HavenMaintenanceRouter.post(
  "/dashboard/add-maintenance/",
  upload.fields([{ name: "attachments" }]),
  authMiddleware,
  DashboardAddMaintenance,
);

HavenMaintenanceRouter.patch(
  "/dashboard/approve-maintenance/:maintenanceId",
  authMiddleware,
  DashboardApproveMaintnance,
);
HavenMaintenanceRouter.delete(
  "/dashboard/delete-maintenance/:maintenanceId",
  authMiddleware,
  DashboardDeletMaintenance,
);

// tenant

HavenMaintenanceRouter.get(
  "/tenant/get-tenant-maintenance",
  TenantGetMaintenance,
);

HavenMaintenanceRouter.post(
  "/tenant/add-maintenance/",
  upload.fields([{ name: "attachments" }]),
  TenantAddMaintenance,
);

HavenMaintenanceRouter.delete(
  "/tenant/delete-maintenance/:maintenanceId",
  TenantDeleteMaintenance,
);
export default HavenMaintenanceRouter;
