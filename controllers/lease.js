//
import HavenLease, { UsedLeaseToken } from "../schema/lease.js";
import jwt from "jsonwebtoken";
import HavenProperty from "../schema/property.js";
import { sendLeaseFormEmail, sendMagicLink } from "../utils/sendEmail.js";
import { v4 as uuidv4 } from "uuid";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";
import HavenProperties from "../schema/property.js";
import sendNotification from "../utils/sendNotification.js";
import UserSchema from "../schema/user.js";
import { SendResponse } from "../utils/sendResponse.js";

const JWT_SECRET = process.env.JWTSECRET;

export const CreateLeaseFromToken = async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Invalid token in header",
      });
    }

    const userToken = req.authBearerId;
    const landlordId = jwt.verify(userToken, process.env.JWTSECRET).Id;

    const { propertyId } = req.body;
    const propertyDetails = await HavenProperty.findOne({ _id: propertyId });

    if (!propertyDetails) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Property not found",
      });
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
      { expiresIn: "12h" },
    );

    return SendResponse(res, {
      success: true,
      data: {
        url: `${process.env.FRONTENDURL}/tenant/submit-lease?token=${token}&propertyName=${propertyDetails.propertyName}`,
      },
      message: "Lease form URL generated successfully",
    });
  } catch (error) {
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
      data: error,
    });
  }
};

export const SendLeaseAsEmail = async (req, res) => {
  try {
    const { url, email } = req.body;

    function extractTokenFromUrl(url) {
      const urlObj = new URL(url);
      return urlObj.searchParams.get("token");
    }

    const token = extractTokenFromUrl(url);

    const payload = jwt.verify(token, process.env.JWTSECRET);
    const { propertyDetails } = payload;

    await sendLeaseFormEmail(email, email, url, propertyDetails.propertyName);

    return SendResponse(res, {
      success: true,
      data: { url },
      message: "Lease form sent successfully via email",
    });
  } catch (error) {
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
      data: error,
    });
  }
};

export const CreateLeaseFromLandlord = async (req, res) => {
  try {
    const userId = req.authBearerId;

    const newLease = new HavenLease({
      ...req.body,
      landlordId: userId,
      status: "active",
    });

    let imageUrl = "";
    let imageId = "";
    if (req.files && req.files.avatar) {
      await Promise.all(
        req.files.avatar.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = await uploadPromise(image.path);
          imageUrl = result.secure_url;
          imageId = result.public_id;
        }),
      );
    }

    newLease.avatar = imageUrl;
    newLease.avatarPublidId = imageId;

    await newLease.save();
    await HavenProperties.updateOne(
      { _id: req.body.propertyId },
      { $inc: { occupiedUnits: 1 } },
    );

    return SendResponse(res, {
      success: true,
      data: newLease,
      message: "Lease created successfully by landlord",
    });
  } catch (error) {
    console.error("Error creating lease:", error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
      data: error,
    });
  }
};

export const CreateLeaseFromTenant = async (req, res) => {
  try {
    const userId = req.authBearerId;
    const { token } = req.body;
    const payload = jwt.verify(token, process.env.JWTSECRET);
    const usedToken = await UsedLeaseToken.findOne({
      jti: payload.usedLeaseToken.jti,
    });

    if (usedToken && usedToken.used) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Token already used",
      });
    }

    // Mark as used

    const newLease = new HavenLease({
      ...req.body,
      landlordId: payload.landlordId,
      propertyId: payload.propertyId,
      tenantId: userId,
    });

    let imageUrl = "";
    let imageId = "";
    await Promise.all(
      req.files.avatar.map(async (image) => {
        const uploadPromise = promisify(cloud.uploader.upload);
        const result = await uploadPromise(image.path);
        imageUrl = result.secure_url;
        imageId = result.public_id;
      }),
    );

    await UsedLeaseToken.updateOne(
      { jti: payload.usedLeaseToken.jti },
      { used: true },
      { upsert: true },
    );
    newLease.avatar = imageUrl;
    newLease.avatarPublidId = imageId;

    await newLease.save();
    await HavenProperties.updateOne(
      { _id: payload.propertyId },
      { $inc: { pendingUnits: 1 } },
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
      io,
    );
    return SendResponse(res, {
      success: true,
      statusCode: 201,
      message: "new lease created",
      data: newLease,
    });
  } catch (error) {
    console.error("Error creating lease:", error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
      data: error,
    });
  }
};

export const LandlordGetAllLease = async (req, res) => {
  try {
    const userId = req.authBearerId;
    const leases = await HavenLease.find({ landlordId: userId });

    return SendResponse(res, {
      data: leases,
    });
  } catch (error) {
    if (error.name == "TokenExpiredError") {
      return SendResponse(res, {
        success: false,
        statusCode: 460,
        message: "Token already used",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return SendResponse(res, {
        success: false,
        statusCode: 461,
        message: "Invalid token",
      });
    }
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
      data: error,
    });
  }
};

export const LandlordEditLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.authBearerId;

    const newLease = req.body;

    if (req.files && req.files.avatar) {
      const oldLease = await HavenLease.findOne({
        landlordId: userId,
        _id: leaseId,
      });

      await Promise.all(
        req.files.avatar.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = await uploadPromise(image.path);
          newLease.avatar = result.secure_url;
          newLease.avatarPublidId = result.public_id;
        }),
      );
      cloud.uploader
        .destroy(oldLease.avatarPublidId)
        .then(async (result) => {});
    }

    const property = await HavenLease.findOneAndUpdate(
      { landlordId: userId.Id, _id: leaseId },

      { $set: newLease },
      { new: true },
    );

    if (!property) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "No lease with this ID",
      });
    }
    return SendResponse(res, {
      success: false,
      statusCode: 200,
      message: "Lease editt successful",
      data: property,
    });
  } catch (error) {
    if (error.name == "TokenExpiredError") {
      return SendResponse(res, {
        success: false,
        statusCode: 461,
        message: "Token is already used",
      });
    }
    if (error.name === "JsonWebTokenError") {
      return SendResponse(res, {
        success: false,
        statusCode: 461,
        message: "Invalid Token",
      });
    }
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: error.message,
      data: error,
    });
  }
};

export const LandlordApproveLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.authBearerId;

    const lease = await HavenLease.findOneAndUpdate(
      { landlordId: userId, _id: leaseId },
      { $set: { leaseStatus: "active" } },
      { new: true },
    );

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Lease with this Id not found",
      });
    }

    await HavenProperties.updateOne(
      { _id: lease.propertyId },
      { $inc: { occupiedUnits: 1, pendingUnits: -1 } },
    );

    return SendResponse(res, {
      message: "Lease edit successful",
      data: lease,
    });
  } catch (error) {
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

    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "An error occurred",
      data: error,
    });
  }
};

export const LandlordDeleteLease = async (req, res) => {
  try {
    const { leaseId } = req.params;
    const userId = req.authBearerId;

    const lease = await HavenLease.findOneAndDelete({
      landlordId: userId,
      _id: leaseId,
    });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Lease with this Id not found",
      });
    }

    cloud.uploader.destroy(lease.avatarPublidId);

    if (lease.leaseStatus === "active") {
      await HavenProperties.updateOne(
        { _id: lease.propertyId },
        { $inc: { occupiedUnits: -1 } },
      );
    }

    return SendResponse(res, {
      message: "Lease Delete successful",
    });
  } catch (error) {
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
        message: "invalid token!",
      });
    }

    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Server error",
      data: error,
    });
  }
};

export const TenanRequestLoginLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Email is required",
      });
    }

    const lease = await HavenLease.findOne({ tenantEmailAddress: email });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Invalid email address.",
      });
    }

    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: "15m" });
    const magicLink = `${process.env.FRONTENDURL}/tenant/magic-link-login?token=${token}`;

    await sendMagicLink(email, magicLink, lease.tenantName);

    return SendResponse(res, {
      message: "Magic link sent to email.",
    });
  } catch (error) {
    console.error("Resend error:", error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Failed to send email.",
      data: error,
    });
  }
};

export const TenantVerifyMagicLink = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Token is required",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    const lease = await HavenLease.findOne({
      tenantEmailAddress: decoded.email,
    });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Invalid token or email.",
      });
    }

    const sessionToken = jwt.sign(
      {
        Id: lease._id,
        email: lease.tenantEmailAddress,
        propertyId: lease.propertyId,
      },
      JWT_SECRET,
      { expiresIn: "5d" },
    );

    return SendResponse(res, {
      data: { token: sessionToken },
    });
  } catch (error) {
    console.error("Verification error:", error);

    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Failed to verify magic link.",
      data: error,
    });
  }
};

export const GettenantLeaseInfo = async (req, res) => {
  try {
    const authorization = req.headers["x-api-key"];

    if (!authorization || authorization.length < 10) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Invalid token in header",
      });
    }

    const { email: tenantEmailAddress } = jwt.verify(
      authorization,
      process.env.JWTSECRET,
    );

    const lease = await HavenLease.findOne({ tenantEmailAddress });

    if (!lease) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "Lease info not found",
      });
    }

    const landlord = await UserSchema.findById(lease.landlordId);
    const property = await HavenProperty.findOne({ userId: landlord._id });

    const responseData = {
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
    };

    return SendResponse(res, {
      data: responseData,
    });
  } catch (error) {
    console.error("Verification error:", error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Failed to verify magic link.",
      data: error,
    });
  }
};
