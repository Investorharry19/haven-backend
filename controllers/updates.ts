import type { Request, Response } from "express";
import cloud from "../utils/cloudinary.ts";
import crypto from "crypto";
import HavenProperties from "../schema/property.ts";
import UpdateSchema from "../schema/updates.ts";
import type { AppServer } from "../types/socket.ts";

type FileType = "image" | "video" | "document";

interface UpdateFile {
  id: string;
  type: FileType;
  name: string;
  size: number;
  url: string;
}

function getFileInfo(file: Express.Multer.File): Omit<UpdateFile, "url"> {
  const mime = file.mimetype || "";
  const name = file.originalname || file.filename || "unknown";
  const size = file.size || 0;

  let type: FileType = "document";
  if (mime.startsWith("image/")) type = "image";
  else if (mime.startsWith("video/")) type = "video";

  const id = crypto.randomBytes(4).toString("hex");
  return { id, type, name, size };
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

export const LandlordGetUpdates = async (req: Request, res: Response) => {
  try {
    const userId = req.authBearerId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const updates = await UpdateSchema.find({ userId });

    return res.status(200).json(updates);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: errorMessage(error) });
  }
};

export const LandlordSendUpdates = async (req: Request, res: Response) => {
  try {
    const userId = req.authBearerId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { propertyId, message } = req.body as {
      propertyId?: string;
      message?: string;
    };

    const property = await HavenProperties.findById(propertyId);

    if (!property) {
      return res.status(404).json({ message: "Property not found" });
    }

    // With upload.array("files"), req.files is an array (or undefined if none sent)
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];

    const fileUrl: UpdateFile[] = await Promise.all(
      files.map(async (file) => {
        const result = await cloud.uploader.upload(file.path, {
          resource_type: "raw",
        });

        return {
          ...getFileInfo(file),
          url: result.secure_url,
        };
      }),
    );

    const newUpdate = new UpdateSchema({
      userId,
      message,
      files: fileUrl,
      propertyId,
    });

    await newUpdate.save();

    const io = req.app.get("io") as AppServer;
    io.to(`_${propertyId}_`).emit("landlord_update:new", newUpdate as any);

    return res.status(200).json({ message: "Post updates", data: newUpdate });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: errorMessage(error) });
  }
};
