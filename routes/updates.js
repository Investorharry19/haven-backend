import Router from "express";
import upload from "../utils/multer.js";
import jwt from "jsonwebtoken";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";
import crypto from "crypto";
import HavenProperties from "../schema/property.js";
import UpdateSchema from "../schema/updates.js";
const UpdatesRouter = Router();

UpdatesRouter.get("/property/landlord-get-updates", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const token = authorization.split("Bearer ")[1];
    const userId = jwt.verify(token, process.env.JWTSECRET).Id;

    const updates = await UpdateSchema.find({ userId });

    res.status(200).json(updates);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error });
  }
});

UpdatesRouter.post(
  "/property/landlord-send-updates",
  upload.array("file"),
  async (req, res) => {
    try {
      const { authorization } = req.headers;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET).Id;

      const property = await HavenProperties.findById(req.body.propertyId);

      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      const fileUrl = [];

      function getFileInfo(file) {
        const mime = file.mimetype || "";
        const name = file.originalname || file.filename || "unknown";
        const size = file.size || 0;

        // detect type
        let type = "document";
        if (mime.startsWith("image/")) type = "image";
        else if (mime.startsWith("video/")) type = "video";
        const id = crypto.randomBytes(4).toString("hex");
        return { id, type, name, size };
      }

      await Promise.all(
        req.files.map(async (file) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const resourceType = file.mimetype.startsWith("image/")
            ? "image"
            : file.mimetype.startsWith("video/")
              ? "video"
              : "raw";

          const result = await cloud.uploader.upload(file.path, {
            resource_type: "raw",
          });

          const info = getFileInfo(file);
          fileUrl.push({
            ...info,
            url: result.secure_url,
          });
        })
      );

      const newUpdate = new UpdateSchema({
        userId,
        message: req.body.message,
        files: fileUrl,
        propertyId: req.body.propertyId,
      });

      await newUpdate.save();
      const io = req.app.get("io");
      io.to(`_${req.body.propertyId}_`).emit("landlord_update:new", newUpdate);

      res.status(200).json({ message: "Post updates", data: newUpdate });
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: error });
    }
  }
);

export default UpdatesRouter;
