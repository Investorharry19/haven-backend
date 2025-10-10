import HavenLease, { UsedLeaseToken } from "../schema/lease.js";
import { Router } from "express";
import jwt from "jsonwebtoken";
import HavenProperty from "../schema/property.js";
import { sendLeaseFormEmail, sendMagicLink } from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import upload from "../utils/multer.js";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";
import { Resend } from "resend";
import HavenProperties from "../schema/property.js";
import sendNotification from "../utils/sendNotification.js";
import UserSchema from "../schema/user.js";
import { profile } from "console";

const resend = new Resend(process.env.RESEND_API_KEY);
const JWT_SECRET = process.env.JWTSECRET;
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

      res.status(200).json({
        url: `http://localhost:3000/tenant/submit-lease?token=${token}&propertyName=${propertyDetails.propertyName}`,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

HavenLeaseRouter.post("/dashboard/send-lease-as-email", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const { url, email } = req.body;

    function extractTokenFromUrl(url) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("token");
    }

    const token = extractTokenFromUrl(url);

    const payload = jwt.verify(token, process.env.JWTSECRET);
    const { propertyDetails } = payload;

    sendLeaseFormEmail(email, email, url, propertyDetails.propertyName);

    res.status(200).json({ url });
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
        status: "active",
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
      await HavenProperties.updateOne(
        { _id: req.body.propertyId },
        { $inc: { occupiedUnits: 1 } }
      );
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
      const payload = jwt.verify(token, process.env.JWTSECRET);
      const usedToken = await UsedLeaseToken.findOne({
        jti: payload.usedLeaseToken.jti,
      });

      if (usedToken && usedToken.used) {
        return res.status(400).json({ message: "Token already used!" });
      }

      // Mark as used

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

      await UsedLeaseToken.updateOne(
        { jti: payload.usedLeaseToken.jti },
        { used: true },
        { upsert: true }
      );
      newLease.avatar = imageUrl;
      newLease.avatarPublidId = imageId;

      await newLease.save();
      await HavenProperties.updateOne(
        { _id: payload.propertyId },
        { $inc: { pendingUnits: 1 } }
      );

      const io = req.app.get("io");
      const data = {
        title: "New Lease From " + req.body.tenantName,
        message:
          req.body.tenantName +
          " Just filled out the form sent to them. Please review and approve the lease request",
        type: "lease",
        sub: "lease-created",
      };

      sendNotification(
        {
          userId: payload.landlordId,
          type: "lease",
          payload: newLease,
          data,
        },
        io
      );
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
    if (error.name == "TokenExpiredError") {
      return res.status(460).json({ message: "Token already used!" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(461).json({ message: "invalid token!" });
    }
    res.status(500).json(error);
  }
});

HavenLeaseRouter.patch(
  "/dashboard/edit-lease/:leaseId",
  upload.fields([{ name: "avatar" }]),
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { leaseId } = req.params;
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const newLease = req.body;

      if (req.files && req.files.avatar) {
        const oldLease = await HavenLease.findOne({
          landlordId: userId.Id,
          _id: leaseId,
        });

        await Promise.all(
          req.files.avatar.map(async (image) => {
            const uploadPromise = promisify(cloud.uploader.upload);
            const result = await uploadPromise(image.path);
            newLease.avatar = result.secure_url;
            newLease.avatarPublidId = result.public_id;
          })
        );
        cloud.uploader
          .destroy(oldLease.avatarPublidId)
          .then(async (result) => {});
      }

      const property = await HavenLease.findOneAndUpdate(
        { landlordId: userId.Id, _id: leaseId },

        { $set: newLease },
        { new: true }
      );

      if (!property) {
        return res.status(404).json({
          message: "Lease with this Id not found",
        });
      }
      res.status(200).json({ message: "Lease edit sucessful", property });
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  }
);

HavenLeaseRouter.patch(
  "/dashboard/approve-lease/:leaseId",
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { leaseId } = req.params;
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const lease = await HavenLease.findOneAndUpdate(
        { landlordId: userId.Id, _id: leaseId },
        { $set: { leaseStatus: "active" } },
        { new: true }
      );

      if (!lease) {
        return res.status(404).json({
          message: "Lease with this Id not found",
        });
      }
      await HavenProperties.updateOne(
        { _id: lease.propertyId },
        { $inc: { occupiedUnits: 1, pendingUnits: -1 } }
      );
      res.status(200).json({ message: "Lease edit sucessful", lease });
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  }
);

HavenLeaseRouter.delete(
  "/dashboard/delete-lease/:leaseId",
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { leaseId } = req.params;
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const lease = await HavenLease.findOneAndDelete({
        landlordId: userId.Id,
        _id: leaseId,
      });

      if (!lease) {
        return res.status(404).json({
          message: "Lease with this Id not found",
        });
      }

      cloud.uploader.destroy(lease.avatarPublidId).then(async (result) => {});
      if (lease.leaseStatus == "active") {
        await HavenProperties.updateOne(
          { _id: lease.propertyId },
          { $inc: { occupiedUnits: -1 } }
        );
      }

      res.status(200).json({ message: "Lease Delete sucessful" });
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  }
);

HavenLeaseRouter.post("/tenant/login-mail", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const lease = await HavenLease.findOne({ tenantEmailAddress: email });
    if (!lease) {
      return res.status(404).json({ message: "Invalid email address." });
    }

    // Generate token valid for 15 minutes
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });
    const magicLink = `${process.env.FRONTENDURL}/tenant/magic-link-login?token=${token}`;

    await sendMagicLink(email, magicLink, lease.tenantName);

    return res.status(200).json({ message: "Magic link sent to email." });
  } catch (error) {
    console.error("Resend error:", error);
    return res.status(500).json({ error: "Failed to send email." });
  }
});

HavenLeaseRouter.post("/tenant/verify-magic-link", async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token is required" });

    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    const lease = await HavenLease.findOne({
      tenantEmailAddress: decoded.email,
    });

    if (!lease) {
      return res.status(404).json({ message: "Invalid token or email." });
    }

    // Generate a new JWT for the session
    const sessionToken = jwt.sign(
      {
        Id: lease._id,
        email: lease.tenantEmailAddress,
        propertyId: lease.propertyId,
      },
      JWT_SECRET,
      { expiresIn: "5d" }
    );

    return res.status(200).json({ token: sessionToken });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Failed to verify magic link." });
  }
});

HavenLeaseRouter.get("/tenant/get-my-lease-info", async (req, res) => {
  try {
    const authorization = req.headers["x-api-key"];

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const { email: tenantEmailAddress } = jwt.verify(
      authorization,
      process.env.JWTSECRET
    );
    const lease = await HavenLease.findOne({ tenantEmailAddress });

    if (!lease) {
      return res.status(404).json({
        message: "lease Info not found",
      });
    }
    const landlord = await UserSchema.findById(lease.landlordId);
    const property = await HavenProperty.findOne({ userId: landlord._id });

    res.status(200).json({
      ...lease._doc,
      landlord: {
        ...landlord._doc,
        password: "",
        subscription: "",
        profile: {
          ...landlord._doc.personal,
          profileUrl: landlord.personal.avatarUrl,
        },
      },
      property: {
        propertyName: property.propertyName,
        propertyLocation: property.propertyLocation,
        propertyType: property.propertyType,
        country: property.country,
        propertyImagesUrl: property.propertyImagesUrl,
      },
    });
  } catch (error) {
    console.error("Verification error:", error);
    return res.status(500).json({ error: "Failed to verify magic link." });
  }
});

export default HavenLeaseRouter;
