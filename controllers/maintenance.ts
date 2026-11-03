//
import HavenMaintenance from "../schema/maintenance.ts";
import HavenLease from "../schema/lease.ts";
import cloud from "../utils/cloudinary.ts";
import { promisify } from "util";
import sendNotification from "../utils/sendNotification.ts";
import { SendResponse } from "../utils/sendResponse.ts";
import { verifyToken } from "../utils/jwt.ts";
import { Request, Response } from "express";
import { coudinaryResponse } from "../types/cloudinary.ts";

export const DashboardGetALlMaintenance = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.authBearerId;

    const maintenance = await HavenMaintenance.find({
      landlordId: userId,
    }).sort({
      createdAt: -1,
    });

    return SendResponse(res, { data: maintenance });
  } catch (error: any) {
    console.error("Error fetching maintenance:", error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
    });
  }
};

export const DashboardAddMaintenance = async (req: Request, res: Response) => {
  try {
    const newMaintainance = req.body;

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    if (files && files.attachments) {
      const attachment: string[] = [];
      const attachmentIds: string[] = [];

      await Promise.all(
        files.attachments.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = (await uploadPromise(image.path)) as coudinaryResponse;
          attachment.push(result.secure_url);
          attachmentIds.push(result.public_id);
        }),
      );

      newMaintainance.requestImages = attachment;
      newMaintainance.requestImagePublicIds = attachmentIds;
    }

    const maintenance = new HavenMaintenance(newMaintainance);

    const data = {
      title: "New Maintenance request",
      message: `${req.body.tenantName} A new maintenance request was just added. Please check it out`,
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
      io,
    );

    await maintenance.save();

    return SendResponse(res, { message: "Successful", data: maintenance });
  } catch (error) {
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      data: error,
    });
  }
};

export const DashboardApproveMaintnance = async (
  req: Request,
  res: Response,
) => {
  try {
    const { maintenanceId } = req.params;
    const userId = req.authBearerId;

    const maintenance = await HavenMaintenance.findOneAndUpdate(
      { landlordId: userId, _id: maintenanceId },
      { $set: { isResolved: true } },
      { new: true },
    );

    if (!maintenance) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Maintenance with this Id not found",
      });
    }

    return SendResponse(res, { message: "Successful", data: maintenance });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return SendResponse(res, {
        success: false,
        statusCode: 460,
        message: "Token already used!",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return SendResponse(res, {
        success: false,
        statusCode: 461,
        message: "Invalid token!",
      });
    }
    return SendResponse(res, { success: false, statusCode: 500, data: error });
  }
};

export const DashboardDeletMaintenance = async (
  req: Request,
  res: Response,
) => {
  try {
    const { maintenanceId } = req.params;
    const userId = req.authBearerId;

    const maintenance = await HavenMaintenance.findOneAndDelete({
      landlordId: userId,
      _id: maintenanceId,
    });

    if (!maintenance) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Maintenance with this Id not found",
      });
    }

    return SendResponse(res, { message: "Successful", data: maintenance });
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return SendResponse(res, {
        success: false,
        statusCode: 460,
        message: "Token already used!",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return SendResponse(res, {
        success: false,
        statusCode: 461,
        message: "Invalid token!",
      });
    }
    return SendResponse(res, { success: false, statusCode: 500, data: error });
  }
};

export const TenantGetMaintenance = async (req: Request, res: Response) => {
  try {
    const authorization = req.headers["x-api-key"];
    if (!authorization || authorization.length < 10) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Invalid token in header",
      });
    }

    const { email: tenantEmailAddress } = verifyToken(authorization as string);
    const lease = await HavenLease.findOne({ tenantEmailAddress });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Lease info not found",
      });
    }

    const maintenanceRequests = await HavenMaintenance.find({
      tenantId: lease._id,
    }).sort({
      createdAt: -1,
    });

    return SendResponse(res, { data: maintenanceRequests });
  } catch (error) {
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Failed to verify magic link",
      data: error,
    });
  }
};

export const TenantAddMaintenance = async (req: Request, res: Response) => {
  try {
    const authorization = req.headers["x-api-key"];
    if (!authorization || authorization.length < 10) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Invalid token in header",
      });
    }

    const { email: tenantEmailAddress } = verifyToken(authorization as string);
    const lease = await HavenLease.findOne({ tenantEmailAddress });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Lease info not found",
      });
    }

    const newMaintainance = req.body;

    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    if (files && files.attachments) {
      const attachment: string[] = [];
      const attachmentIds: string[] = [];

      await Promise.all(
        files.attachments.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = (await uploadPromise(image.path)) as coudinaryResponse;
          attachment.push(result.secure_url);
          attachmentIds.push(result.public_id);
        }),
      );

      newMaintainance.requestImages = attachment;
      newMaintainance.requestImagePublicIds = attachmentIds;
    }

    newMaintainance.propertyId = lease.propertyId;
    newMaintainance.landlordId = lease.landlordId;
    newMaintainance.affectedUnit = lease.tenantUnit;

    const maintenance = new HavenMaintenance(newMaintainance);

    const data = {
      title: "New Maintenance request",
      message: `${lease.tenantName} A new maintenance request was just added. Please check it out`,
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
      io,
    );

    await maintenance.save();

    return SendResponse(res, { message: "Successful", data: maintenance });
  } catch (error) {
    return SendResponse(res, { success: false, statusCode: 500, data: error });
  }
};

export const TenantDeleteMaintenance = async (req: Request, res: Response) => {
  try {
    const { maintenanceId } = req.params;
    const authorization = req.headers["x-api-key"];

    if (!authorization || authorization.length < 10) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Invalid token in header",
      });
    }

    const { email: tenantEmailAddress } = verifyToken(authorization as string);
    const lease = await HavenLease.findOne({ tenantEmailAddress });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Lease info not found",
      });
    }

    const maintenance = await HavenMaintenance.findOneAndDelete({
      landlordId: lease.landlordId,
      _id: maintenanceId,
    });

    if (!maintenance) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Maintenance with this Id not found",
      });
    }

    return SendResponse(res, { message: "Successful", data: maintenance });
  } catch (error) {
    return SendResponse(res, { success: false, statusCode: 500, data: error });
  }
};
