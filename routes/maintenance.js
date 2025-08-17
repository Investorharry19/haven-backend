import HavenMaintenance from "../schema/maintenance.js";
import HavenLease from "../schema/lease.js";
import { Router } from "express";
import upload from "../utils/multer.js";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import sendNotification from "../utils/sendNotification.js";
const HavenMaintenanceRouter = Router();

//landlord get maintenance
HavenMaintenanceRouter.get(
  "/dashboard/get-all-maintenance",
  async (req, res) => {
    try {
      const { authorization } = req.headers;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET).Id;

      const maintenance = await HavenMaintenance.find({
        landlordId: userId,
      }).sort({ createdAt: -1 });

      console.log("maintenance");
      console.log(maintenance);
      res.status(200).json(maintenance);
    } catch (error) {
      console.error("Error creating lease:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

HavenMaintenanceRouter.post(
  "/dashboard/add-maintenance/",
  upload.fields([{ name: "attachments" }]),
  async (req, res) => {
    try {
      const newMaintainance = req.body;

      if (req.files && req.files.attachments) {
        const attachment = [];
        const attachmentIds = [];

        await Promise.all(
          req.files.attachments.map(async (image) => {
            const uploadPromise = promisify(cloud.uploader.upload);
            const result = await uploadPromise(image.path);
            attachment.push(result.secure_url);
            attachmentIds.push(result.public_id);
          })
        );

        newMaintainance.requestImages = attachment;
        newMaintainance.requestImagePublicIds = attachmentIds;
      }

      const maintenance = new HavenMaintenance(newMaintainance);
      const data = {
        title: "New Maintenance request ",
        message:
          req.body.tenantName +
          " A new maintenance request was just added. Please check it out",
        type: "maintenance",
      };

      const io = req.app.get("io");
      sendNotification(
        {
          userId: req.body.landlordId,
          type: "maintenance",
          payload: maintenance,
          data,
        },
        io
      );
      await maintenance.save();
      res.status(200).json({ message: "Sucessful", maintenance });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
);

HavenMaintenanceRouter.patch(
  "/dashboard/approve-maintenance/:maintenanceId",
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { maintenanceId } = req.params;
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const maintenance = await HavenMaintenance.findOneAndUpdate(
        { landlordId: userId.Id, _id: maintenanceId },
        { $set: { isResolved: true } },
        { new: true }
      );

      if (!maintenance) {
        return res.status(404).json({
          message: "Maintenance with this Id not found",
        });
      }
      res.status(200).json({ message: "Sucessful", maintenance });
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
  }
);
HavenMaintenanceRouter.delete(
  "/dashboard/delete-maintenance/:maintenanceId",
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { maintenanceId } = req.params;
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const maintenance = await HavenMaintenance.findOneAndDelete({
        landlordId: userId.Id,
        _id: maintenanceId,
      });

      if (!maintenance) {
        return res.status(404).json({
          message: "Maintenance with this Id not found",
        });
      }
      res.status(200).json({ message: "Sucessful", maintenance });
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
  }
);

// tenant

HavenMaintenanceRouter.get(
  "/tenant/get-tenant-maintenance",
  async (req, res) => {
    try {
      const authorization = req.headers["x-api-key"];

      console.log(authorization);
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const { email: tenantEmailAddress } = jwt.verify(
        authorization,
        process.env.JWTSECRET
      );
      console.log(tenantEmailAddress);
      const lease = await HavenLease.findOne({ tenantEmailAddress });

      if (!lease) {
        return res.status(404).json({
          message: "lease Info not found",
        });
      }

      const maintenanceRequests = await HavenMaintenance.find({
        tenantId: lease._id,
      }).sort({ createdAt: -1 });
      res.status(200).json(maintenanceRequests);
    } catch (error) {
      console.error("Verification error:", error);
      return res.status(500).json({ error: "Failed to verify magic link." });
    }
  }
);

HavenMaintenanceRouter.post(
  "/tenant/add-maintenance/",
  upload.fields([{ name: "attachments" }]),
  async (req, res) => {
    try {
      const authorization = req.headers["x-api-key"];

      console.log(authorization);
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const { email: tenantEmailAddress } = jwt.verify(
        authorization,
        process.env.JWTSECRET
      );
      console.log(tenantEmailAddress);
      const lease = await HavenLease.findOne({ tenantEmailAddress });

      if (!lease) {
        return res.status(404).json({
          message: "lease Info not found",
        });
      }

      console.log(lease);

      const newMaintainance = req.body;

      if (req.files && req.files.attachments) {
        const attachment = [];
        const attachmentIds = [];

        await Promise.all(
          req.files.attachments.map(async (image) => {
            const uploadPromise = promisify(cloud.uploader.upload);
            const result = await uploadPromise(image.path);
            attachment.push(result.secure_url);
            attachmentIds.push(result.public_id);
          })
        );

        newMaintainance.requestImages = attachment;
        newMaintainance.requestImagePublicIds = attachmentIds;
      }

      newMaintainance.propertyId = lease.propertyId;
      newMaintainance.landlordId = lease.landlordId;
      newMaintainance.affectedUnit = lease.tenantUnit;

      console.log(252, newMaintainance);
      const maintenance = new HavenMaintenance(newMaintainance);
      const data = {
        title: "New Maintenance request ",
        message:
          lease.tenantName +
          " A new maintenance request was just added. Please check it out",
        type: "maintenance",
      };

      const io = req.app.get("io");
      sendNotification(
        {
          userId: lease.landlordId,
          type: "maintenance",
          payload: maintenance,
          data,
        },
        io
      );
      await maintenance.save();
      res.status(200).json({ message: "Sucessful", maintenance });
    } catch (error) {
      console.log(error);
      res.status(500).json(error);
    }
  }
);

HavenMaintenanceRouter.delete(
  "/tenant/delete-maintenance/:maintenanceId",
  async (req, res) => {
    try {
      const { maintenanceId } = req.params;
      const authorization = req.headers["x-api-key"];

      console.log(authorization);
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const { email: tenantEmailAddress } = jwt.verify(
        authorization,
        process.env.JWTSECRET
      );
      console.log(tenantEmailAddress);
      const lease = await HavenLease.findOne({ tenantEmailAddress });

      if (!lease) {
        return res.status(404).json({
          message: "lease Info not found",
        });
      }

      const maintenance = await HavenMaintenance.findOneAndDelete({
        landlordId: lease.landlordId,
        _id: maintenanceId,
      });

      if (!maintenance) {
        return res.status(404).json({
          message: "Maintenance with this Id not found",
        });
      }
      res.status(200).json({ message: "Sucessful", maintenance });
    } catch (error) {}
  }
);
export default HavenMaintenanceRouter;
