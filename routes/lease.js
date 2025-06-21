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

      const { propertyId, email } = req.body;
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

      sendLeaseFormEmail(
        email,
        email,
        `https://localhost:3000/tenant/submit?token=${token}&propertyName=${propertyDetails.propertyName}`,
        propertyDetails.propertyName
      );

      res.status(200).json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

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
  "/dashboard/create-landlord",
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
      res.status(500).json({ message: error.message });
    }
  }
);

// ceate lease from tennt
HavenLeaseRouter.post(
  "/dashboard/create-lease",
  upload.fields([{ name: "avatar" }]),
  async (req, res) => {
    try {
      const { token } = req.body;
      const payload = jwt.verify(token, process.env.JWTSECRET);
      const usedToken = await UsedLeaseToken.findOne({
        jti: payload.usedLeaseToken.jti,
      });

      if (usedToken && usedToken.used) {
        return res.status(400).json({ message: "Token already used!" });
      }

      // Mark as used
      await UsedLeaseToken.updateOne(
        { jti: payload.usedLeaseToken.jti },
        { used: true },
        { upsert: true }
      );

      const newLease = new HavenLease({
        ...req.body,
        landlordId: payload.landlordId,
        propertyId: payload.propertyId,
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
      res.status(500).json({ message: error.message });
    }
  }
);

export default HavenLeaseRouter;
