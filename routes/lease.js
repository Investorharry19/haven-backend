import { Router } from "express";
import upload from "../utils/multer.js";
import {
  LandlordGetAllLease,
  CreateLeaseFromLandlord,
  CreateLeaseFromTenant,
  CreateLeaseFromToken,
  SendLeaseAsEmail,
  LandlordEditLease,
  LandlordApproveLease,
  LandlordDeleteLease,
  TenanRequestLoginLink,
  TenantVerifyMagicLink,
  GettenantLeaseInfo,
} from "../controllers/lease.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const HavenLeaseRouter = Router();

// create lease form token
/**
 * @swagger
 * /dashboard/create-lease-form-token:
 *   post:
 *     summary: Generate a lease form URL for a tenant using a property ID and user token
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               propertyId:
 *                 type: string
 *                 description: ID of the property to create the lease for
 *                 example: "64f7b5b2c123456789abcdef"
 *     responses:
 *       200:
 *         description: Lease form URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid token or property not found
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
HavenLeaseRouter.post(
  "/dashboard/create-lease-form-token",
  authMiddleware,
  CreateLeaseFromToken,
);

/**
 * @swagger
 * /dashboard/send-lease-as-email:
 *   post:
 *     summary: Send a lease form URL as an email to a tenant
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 description: Lease form URL containing token
 *                 example: "https://example.com/tenant/submit-lease?token=abcd1234"
 *               email:
 *                 type: string
 *                 description: Recipient email address
 *                 example: "tenant@example.com"
 *     responses:
 *       200:
 *         description: Lease form sent successfully via email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid token in header
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
HavenLeaseRouter.post(
  "/dashboard/send-lease-as-email",
  authMiddleware,
  SendLeaseAsEmail,
);

// create lease from landlord
HavenLeaseRouter.post(
  "/dashboard/landlord-create-lease",
  upload.fields([{ name: "avatar" }]),
  authMiddleware,
  CreateLeaseFromLandlord,
);

// ceate lease from tennt
HavenLeaseRouter.post(
  "/dashboard/tenant-create-lease",
  upload.fields([{ name: "avatar" }]),
  authMiddleware,
  CreateLeaseFromTenant,
);

// landlord get all leases
HavenLeaseRouter.get(
  "/dashboard/get-lease",
  authMiddleware,
  LandlordGetAllLease,
);

HavenLeaseRouter.patch(
  "/dashboard/edit-lease/:leaseId",
  upload.fields([{ name: "avatar" }]),
  authMiddleware,
  LandlordEditLease,
);

HavenLeaseRouter.patch(
  "/dashboard/approve-lease/:leaseId",
  authMiddleware,
  LandlordApproveLease,
);

HavenLeaseRouter.delete(
  "/dashboard/delete-lease/:leaseId",
  authMiddleware,
  LandlordDeleteLease,
);

// tenant

HavenLeaseRouter.post("/tenant/login-mail", TenanRequestLoginLink);

HavenLeaseRouter.post("/tenant/verify-magic-link", TenantVerifyMagicLink);

HavenLeaseRouter.get("/tenant/get-my-lease-info", GettenantLeaseInfo);

export default HavenLeaseRouter;
