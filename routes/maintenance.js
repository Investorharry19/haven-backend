import HavenMaintenance from "../schema/maintenance.js";
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

      const maintenance = await HavenMaintenance.find({ landlordId: userId });

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

        newMaintainance.attachment = attachment;
        newMaintainance.attachmentIds = attachmentIds;
      }

      const maintenance = new HavenMaintenance(newMaintainance);
      const data = {
        title: "New Maintenance request ",
        message:
          req.body.tenantName +
          " A new maintenance request was just added. Please check it out",
        type: "maintenance",
      };

      await sendNotification({
        userId: req.body.landlordId,
        type: "maintenance",
        payload: maintenance,
        data,
      });
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

export default HavenMaintenanceRouter;
