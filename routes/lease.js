import HavenLease, { UsedLeaseToken } from "../schema/lease.js";
import { Router } from "express";
import jwt from "jsonwebtoken";
import HavenProperty from "../schema/property.js";
import { sendLeaseFormEmail } from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import upload from "../utils/multer.js";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";

const HavenLeaseRouter = Router();

/**
 * @swagger
 * /dashboard/create-lease-form-token:
 *   post:
 *     summary: Create a lease form token and send a lease form link via email
 *     tags: [Lease]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - email
 *             properties:
 *               propertyId:
 *                 type: string
 *                 example: 64e4b8c2f1a2b3c4d5e6f7a8
 *               email:
 *                 type: string
 *                 example: tenant@example.com
 *     responses:
 *       200:
 *         description: Token created and email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid token in header or property not found
 *       500:
 *         description: Internal server error
 */
// create lease form token
HavenLeaseRouter.post(
  "/dashboard/create-lease-form-token",
  async (req, res) => {
    try {
      const { authorization } = req.headers;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const userToken = authorization.split("Bearer ")[1];
      const landlordId = jwt.verify(userToken, process.env.JWTSECRET).Id;

      const { propertyId } = req.body;
      const propertyDetails = await HavenProperty.findOne({
        _id: propertyId,
      });

      if (!propertyDetails) {
        return res.status(400).json({ message: "Property not found" });
      }

      const jti = uuidv4();
      const newUsedLeaseToken = new UsedLeaseToken({ jti });
      await newUsedLeaseToken.save();

      const token = jwt.sign(
        {
          propertyId,
          landlordId,
          propertyDetails,
          usedLeaseToken: newUsedLeaseToken,
        },
        process.env.JWTSECRET,
        {
          expiresIn: "12h",
        }
      );

      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

HavenLeaseRouter.post("/dashboard/send-lease-as-emai", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const userToken = authorization.split("Bearer ")[1];

    const { token, email } = req.body;
    const payload = jwt.verify(token, process.env.JWTSECRET);
    const { propertyDetails } = payload;

    sendLeaseFormEmail(
      email,
      email,
      `http://localhost:3000/tenant/submit-lease?token=${token}&propertyName=${propertyDetails.propertyName}`,
      propertyDetails.propertyName
    );

    console.log(
      `http://localhost:3000/tenant/submit-lease?token=${token}&propertyName=${propertyDetails.propertyName}`
    );

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

/**
 * @swagger
 * /dashboard/create-lease:
 *   post:
 *     summary: Create a new lease
 *     tags: [Lease]
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
 *                 description: JWT token containing lease and property details
 *     responses:
 *       201:
 *         description: Lease created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lease'
 *       500:
 *         description: Internal server error
 */
// create lease from landlord
HavenLeaseRouter.post(
  "/dashboard/landlord-create-lease",
  upload.fields([{ name: "avatar" }]),
  async (req, res) => {
    try {
      const { authorization } = req.headers;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET).Id;

      const newLease = new HavenLease({
        ...req.body,
        landlordId: userId,
      });

      let imageUrl = "";
      let imageId = "";
      await Promise.all(
        req.files.avatar.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = await uploadPromise(image.path);
          imageUrl = result.secure_url;
          imageId = result.public_id;
        })
      );

      newLease.avatar = imageUrl;
      newLease.avatarPublidId = imageId;

      await newLease.save();
      res.status(201).json(newLease);
    } catch (error) {
      console.error("Error creating lease:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ceate lease from tennt
HavenLeaseRouter.post(
  "/dashboard/tenant-create-lease",
  upload.fields([{ name: "avatar" }]),
  async (req, res) => {
    try {
      const { token } = req.body;
      // console.log("Token received:", token);
      console.log(typeof token);
      const payload = jwt.verify(token, process.env.JWTSECRET);
      const usedToken = await UsedLeaseToken.findOne({
        jti: payload.usedLeaseToken.jti,
      });
      console.log("Used token:", usedToken);

      if (usedToken && usedToken.used) {
        return res.status(400).json({ message: "Token already used!" });
      }

      // Mark as used

      const newLease = new HavenLease({
        ...req.body,
        landlordId: payload.landlordId,
        propertyId: payload.propertyId,
      });

      console.log("New lease data:", newLease);
      let imageUrl = "";
      let imageId = "";
      await Promise.all(
        req.files.avatar.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = await uploadPromise(image.path);
          imageUrl = result.secure_url;
          imageId = result.public_id;
        })
      );

      await UsedLeaseToken.updateOne(
        { jti: payload.usedLeaseToken.jti },
        { used: true },
        { upsert: true }
      );
      newLease.avatar = imageUrl;
      newLease.avatarPublidId = imageId;

      console.log("New lease data:", newLease);
      await newLease.save();
      res.status(201).json(newLease);
    } catch (error) {
      console.error("Error creating lease:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

/**
 * @swagger
 * /dashboard/tenant-create-lease:
 *   post:
 *     summary: Tenant creates a new lease using a token
 *     tags: [Lease]
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
 *               - leaseStatus
 *               - avatar
 *             properties:
 *               token:
 *                 type: string
 *                 description: JWT token containing lease and property details
 *               tenantName:
 *                 type: string
 *               tenantEmailAddress:
 *                 type: string
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
 *                 format: date
 *               endsOn:
 *                 type: string
 *                 format: date
 *               leaseStatus:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Lease created successfully
 *         content:
 *           application/json:
 *
 *
 *       400:
 *         description: Token already used or invalid
 *       500:
 *        description: Internal server error
 */

// landlord get all leases
HavenLeaseRouter.get("/dashboard/get-lease", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const token = authorization.split("Bearer ")[1];
    const userId = jwt.verify(token, process.env.JWTSECRET).Id;

    const leases = await HavenLease.find({ landlordId: userId });

    res.status(200).json(leases);
  } catch (error) {
    console.log(error);
    if (error.name == "TokenExpiredError") {
      console.log("WWWWWWWWWWWWWWWWWWW");
      return res.status(460).json({ message: "Token already used!" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(461).json({ message: "invalid token!" });
    }
    res.status(500).json(error);
  }
});

/**
 *
 * @swagger
 * /dashboard/get-lease:
 *   get:
 *     summary: Get all leases for the authenticated landlord
 *     tags: [Lease]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leases for the landlord
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *
 *       400:
 *         description: Invalid token in header
 *       460:
 *         description: Token already used!
 *       461:
 *         description: Invalid token!
 *       500:
 *         description: Internal server error
 *
 *
 */

export default HavenLeaseRouter;
