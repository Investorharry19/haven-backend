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
/**
 * @swagger
 * /dashboard/landlord-create-lease:
 *   post:
 *     summary: Create a lease directly as the authenticated landlord
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - tenantName
 *               - tenantEmailAddress
 *               - tenantUnit
 *               - tenantGender
 *               - tenantPhoneNumber
 *               - leaseFee
 *               - leaseCycle
 *               - startsFrom
 *               - endsOn
 *             properties:
 *               propertyId:
 *                 type: string
 *               tenantName:
 *                 type: string
 *               tenantEmailAddress:
 *                 type: string
 *                 format: email
 *               tenantUnit:
 *                 type: string
 *               tenantGender:
 *                 type: string
 *               tenantPhoneNumber:
 *                 type: string
 *               leaseFee:
 *                 type: number
 *               leaseCycle:
 *                 type: string
 *               startsFrom:
 *                 type: string
 *                 format: date-time
 *               endsOn:
 *                 type: string
 *                 format: date-time
 *               leaseStatus:
 *                 type: string
 *                 description: Lease status; defaults to pending
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Tenant avatar image
 *     responses:
 *       200:
 *         description: Lease created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to create lease
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenLeaseRouter.post(
  "/dashboard/landlord-create-lease",
  upload.fields([{ name: "avatar" }]),
  authMiddleware,
  CreateLeaseFromLandlord,
);

// ceate lease from tennt
/**
 * @swagger
 * /dashboard/tenant-create-lease:
 *   post:
 *     summary: Submit a lease request using a landlord-issued form token
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - tenantName
 *               - tenantEmailAddress
 *               - tenantUnit
 *               - tenantGender
 *               - tenantPhoneNumber
 *               - leaseFee
 *               - leaseCycle
 *               - startsFrom
 *               - endsOn
 *               - avatar
 *             properties:
 *               token:
 *                 type: string
 *                 description: Lease form token generated by the landlord
 *               tenantName:
 *                 type: string
 *               tenantEmailAddress:
 *                 type: string
 *                 format: email
 *               tenantUnit:
 *                 type: string
 *               tenantGender:
 *                 type: string
 *               tenantPhoneNumber:
 *                 type: string
 *               leaseFee:
 *                 type: number
 *               leaseCycle:
 *                 type: string
 *               startsFrom:
 *                 type: string
 *                 format: date-time
 *               endsOn:
 *                 type: string
 *                 format: date-time
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Tenant avatar image
 *     responses:
 *       201:
 *         description: Lease request created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Lease form token has already been used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to create lease request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenLeaseRouter.post(
  "/dashboard/tenant-create-lease",
  upload.fields([{ name: "avatar" }]),
  authMiddleware,
  CreateLeaseFromTenant,
);

// landlord get all leases
/**
 * @swagger
 * /dashboard/get-lease:
 *   get:
 *     summary: Retrieve all leases belonging to the authenticated landlord
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Leases retrieved successfully
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
HavenLeaseRouter.get(
  "/dashboard/get-lease",
  authMiddleware,
  LandlordGetAllLease,
);

/**
 * @swagger
 * /dashboard/edit-lease/{leaseId}:
 *   patch:
 *     summary: Update a lease belonging to the authenticated landlord
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lease to update
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               tenantName:
 *                 type: string
 *               tenantEmailAddress:
 *                 type: string
 *                 format: email
 *               tenantUnit:
 *                 type: string
 *               tenantGender:
 *                 type: string
 *               tenantPhoneNumber:
 *                 type: string
 *               leaseFee:
 *                 type: number
 *               leaseCycle:
 *                 type: string
 *               startsFrom:
 *                 type: string
 *                 format: date-time
 *               endsOn:
 *                 type: string
 *                 format: date-time
 *               leaseStatus:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Replacement tenant avatar image
 *     responses:
 *       200:
 *         description: Lease updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lease with this ID not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       461:
 *         description: Invalid or expired token
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
HavenLeaseRouter.patch(
  "/dashboard/edit-lease/:leaseId",
  upload.fields([{ name: "avatar" }]),
  authMiddleware,
  LandlordEditLease,
);

/**
 * @swagger
 * /dashboard/approve-lease/{leaseId}:
 *   patch:
 *     summary: Approve a lease request belonging to the authenticated landlord
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lease to approve
 *     responses:
 *       200:
 *         description: Lease approved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lease with this ID not found
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
HavenLeaseRouter.patch(
  "/dashboard/approve-lease/:leaseId",
  authMiddleware,
  LandlordApproveLease,
);

/**
 * @swagger
 * /dashboard/delete-lease/{leaseId}:
 *   delete:
 *     summary: Delete a lease belonging to the authenticated landlord
 *     tags:
 *       - Lease
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: leaseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the lease to delete
 *     responses:
 *       200:
 *         description: Lease deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lease with this ID not found
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
HavenLeaseRouter.delete(
  "/dashboard/delete-lease/:leaseId",
  authMiddleware,
  LandlordDeleteLease,
);

// tenant

/**
 * @swagger
 * /tenant/login-mail:
 *   post:
 *     summary: Send a tenant a magic-link login email
 *     tags:
 *       - Lease
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address associated with the tenant's lease
 *     responses:
 *       200:
 *         description: Magic link sent to email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Email is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: No lease found for this email address
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to send email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenLeaseRouter.post("/tenant/login-mail", TenanRequestLoginLink);

/**
 * @swagger
 * /tenant/verify-magic-link:
 *   post:
 *     summary: Verify a tenant magic-link token and return a session token
 *     tags:
 *       - Lease
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Token from the tenant's magic-link email
 *     responses:
 *       200:
 *         description: Magic link verified; returns a tenant session token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Token is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Token or email is invalid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to verify magic link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenLeaseRouter.post("/tenant/verify-magic-link", TenantVerifyMagicLink);

/**
 * @swagger
 * /tenant/get-my-lease-info:
 *   get:
 *     summary: Retrieve lease, landlord, and property information for a tenant
 *     tags:
 *       - Lease
 *     security: []
 *     parameters:
 *       - in: header
 *         name: x-api-key
 *         required: true
 *         schema:
 *           type: string
 *         description: Tenant token returned by the tenant magic-link flow
 *     responses:
 *       200:
 *         description: Tenant lease information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Missing or invalid token in x-api-key header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Lease information not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Failed to retrieve lease information
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
HavenLeaseRouter.get("/tenant/get-my-lease-info", GettenantLeaseInfo);

export default HavenLeaseRouter;
