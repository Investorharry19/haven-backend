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
/**
 * @swagger
 * /dashboard/get-all-maintenance:
 *   get:
 *     summary: Retrieve maintenance requests for the authenticated landlord
 *     tags:
 *       - Maintenance
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maintenance requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to retrieve maintenance requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.get(
  "/dashboard/get-all-maintenance",
  authMiddleware,
  DashboardGetALlMaintenance,
);

/**
 * @swagger
 * /dashboard/add-maintenance/:
 *   post:
 *     summary: Create a maintenance request as the authenticated landlord
 *     tags:
 *       - Maintenance
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - requestCategory
 *               - requestType
 *               - affectedUnit
 *               - requestDescription
 *               - propertyId
 *               - landlordId
 *               - tenantId
 *             properties:
 *               requestCategory:
 *                 type: string
 *               requestType:
 *                 type: string
 *               affectedUnit:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               requestDescription:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images attached to the request
 *               propertyId:
 *                 type: string
 *               landlordId:
 *                 type: string
 *               tenantId:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Maintenance request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to create maintenance request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.post(
  "/dashboard/add-maintenance/",
  upload.fields([{ name: "attachments" }]),
  authMiddleware,
  DashboardAddMaintenance,
);

/**
 * @swagger
 * /dashboard/approve-maintenance/{maintenanceId}:
 *   patch:
 *     summary: Mark a landlord's maintenance request as resolved
 *     tags:
 *       - Maintenance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the maintenance request
 *     responses:
 *       200:
 *         description: Maintenance request marked as resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Maintenance request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       460:
 *         description: Token expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       461:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.patch(
  "/dashboard/approve-maintenance/:maintenanceId",
  authMiddleware,
  DashboardApproveMaintnance,
);
/**
 * @swagger
 * /dashboard/delete-maintenance/{maintenanceId}:
 *   delete:
 *     summary: Delete a maintenance request belonging to the authenticated landlord
 *     tags:
 *       - Maintenance
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the maintenance request
 *     responses:
 *       200:
 *         description: Maintenance request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Maintenance request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       460:
 *         description: Token expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       461:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.delete(
  "/dashboard/delete-maintenance/:maintenanceId",
  authMiddleware,
  DashboardDeletMaintenance,
);

// tenant

/**
 * @swagger
 * /tenant/get-tenant-maintenance:
 *   get:
 *     summary: Retrieve maintenance requests for the authenticated tenant
 *     tags:
 *       - Maintenance
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant token returned by the magic-link login flow
 *     responses:
 *       200:
 *         description: Tenant maintenance requests retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing or invalid x-api-key header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Tenant lease not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to retrieve maintenance requests
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.get(
  "/tenant/get-tenant-maintenance",
  TenantGetMaintenance,
);

/**
 * @swagger
 * /tenant/add-maintenance/:
 *   post:
 *     summary: Submit a maintenance request as the authenticated tenant
 *     tags:
 *       - Maintenance
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant token returned by the magic-link login flow
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - requestCategory
 *               - requestType
 *               - requestDescription
 *               - tenantId
 *             properties:
 *               requestCategory:
 *                 type: string
 *               requestType:
 *                 type: string
 *               requestDescription:
 *                 type: string
 *               estimatedCost:
 *                 type: number
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Images attached to the request
 *               tenantId:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *     responses:
 *       200:
 *         description: Maintenance request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing or invalid x-api-key header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Tenant lease not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to create maintenance request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.post(
  "/tenant/add-maintenance/",
  upload.fields([{ name: "attachments" }]),
  TenantAddMaintenance,
);

/**
 * @swagger
 * /tenant/delete-maintenance/{maintenanceId}:
 *   delete:
 *     summary: Delete a maintenance request as the authenticated tenant
 *     tags:
 *       - Maintenance
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant token returned by the magic-link login flow
 *       - in: path
 *         name: maintenanceId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the maintenance request
 *     responses:
 *       200:
 *         description: Maintenance request deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing or invalid x-api-key header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Tenant lease or maintenance request not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to delete maintenance request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenMaintenanceRouter.delete(
  "/tenant/delete-maintenance/:maintenanceId",
  TenantDeleteMaintenance,
);
export default HavenMaintenanceRouter;
