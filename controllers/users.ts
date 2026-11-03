import { Request, Response } from "express";
import UserSchema from "../schema/user.ts";
import jwt from "jsonwebtoken";
import * as argon2 from "argon2";
import {
  sendAccountActivationMail,
  sendPasswordResetEmail,
} from "../utils/sendEmail.ts";
import axios from "axios";
import cloud from "../utils/cloudinary.ts";
import { SendResponse } from "../utils/sendResponse.ts";
import Subscription from "../schema/subscriptions.ts";
import { verifyToken } from "../utils/jwt.ts";

const hashPassword = async (password: string) => {
  const result = await argon2.hash(password);
  return result;
};

const comparePassword = async (
  savedPassword: string,
  enteredPassword: string,
) => {
  const isMatch = await argon2.verify(savedPassword, enteredPassword);
  return isMatch;
};

//

export const RegisterUser = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body;
    const passwordHash = await hashPassword(password);
    const result = new UserSchema({
      ...req.body,
      passwordHash,
      personal: {
        fullName: req.body.fullName,
      },
      companyInfo: {},
    });
    await result.save();

    const emailConfirmationToken = jwt.sign(
      {
        version: 0,
        role: "emailConfirmation",
        Id: result._id,
      },
      process.env.JWTSECRET as string,
      {
        expiresIn: "10m",
      },
    );

    await sendAccountActivationMail(
      result.email,
      req.body.fullName,
      process.env.FRONTENDURL +
        "/auth/verify-email?token=" +
        emailConfirmationToken +
        "&email=" +
        result.email,
    );
    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User Registered",
    });
  } catch (error: any) {
    console.log(error);
    if (error.errorResponse?.code == 11000 && error.keyPattern.email) {
      return SendResponse(res, {
        success: false,
        statusCode: 460,
        message: "User with this email alrady exists",
        data: { ...error, status: 460 },
      });
    }
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal Server error",
      data: error,
    });
  }
};

export const VerifyEmail = async (req: Request, res: Response) => {
  try {
    const token = req.body.token;
    const { Id } = verifyToken(token);

    const user = await UserSchema.findOne({ _id: Id });
    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    user.emailVerified = true;
    user.version = user.version + 1;
    await user.save();

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Email verified successfully",
    });
  } catch (error: any) {
    if (error.name === "JsonWebTokenError") {
      return SendResponse(res, {
        success: false,
        statusCode: 460,
        message: "Invalid or expired token",
      });
    }
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const LoginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await UserSchema.findOne({ email });

    if (!user) {
      return SendResponse(res, {
        success: false,
        message: "Invalid username or password",
        statusCode: 404,
      });
    }

    const passwordMatch = await comparePassword(
      user.passwordHash as string,
      password,
    );
    if (!passwordMatch) {
      return SendResponse(res, {
        success: false,
        message: "Invalid username or password",
        statusCode: 404,
      });
    }
    if (user.emailVerified === false) {
      const emailConfirmationToken = jwt.sign(
        {
          version: 0,
          role: "emailConfirmation",
          Id: user._id,
        },
        process.env.JWTSECRET as string,
        {
          expiresIn: "10m",
        },
      );
      await sendAccountActivationMail(
        user.email,
        user.email,
        process.env.FRONTENDURL +
          "/auth/verify-email?token=" +
          emailConfirmationToken +
          "&email=" +
          user.email,
      );

      return SendResponse(res, {
        success: false,
        message: "Email not verified",
        statusCode: 461,
      });
    }

    const token = jwt.sign({ Id: user._id }, process.env.JWTSECRET as string, {
      expiresIn: "7d",
    });

    const sendUser = {
      token,
    };
    return SendResponse(res, {
      success: true,
      statusCode: 201,
      data: sendUser,
    });
  } catch (error) {
    console.log(error);
    return SendResponse(res, {
      success: false,
      message: "Internal server error",
      statusCode: 500,
      data: error,
    });
  }
};

export const CurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = req.authBearerId;
    const user = await UserSchema.findOne({ _id: userId });

    console.log({ user, userId });

    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    const subscriptionData = await Subscription.findOne({ user: user._id });

    const userData = user.toObject();
    if (userData.passwordHash) {
      delete userData.passwordHash;
    }
    if (!userData.companyInfo) {
      userData.companyInfo = {};
    }
    return SendResponse(res, {
      success: true,
      statusCode: 200,
      data: {
        ...userData,
        Token: userId,
        password: "",
        subscriptionData,
      },
    });
  } catch (error) {
    console.log(error);
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const ResendEmailVerificationToken = async (
  req: Request,
  res: Response,
) => {
  try {
    const email = req.body.email;
    const result = await UserSchema.findOne({ email });

    if (!result) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "No user with this email",
      });
    }

    const emailConfirmationToken = jwt.sign(
      {
        version: 0,
        role: "emailConfirmation",
        Id: result._id,
      },
      process.env.JWTSECRET as string,
      { expiresIn: "10m" },
    );

    await sendAccountActivationMail(
      result.email,
      result.personal?.fullName as string,
      process.env.FRONTENDURL +
        "/auth/verify-email?token=" +
        emailConfirmationToken +
        "&email=" +
        result.email,
    );

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Email verification token resent successfully",
    });
  } catch (error) {
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const ForgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const user = await UserSchema.findOne({ email });

    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "No user with this email!",
      });
    }

    const token = jwt.sign(
      { Id: user._id, version: user.version ? user.version : 0 },
      process.env.JWTSECRET as string,
      { expiresIn: "10m" },
    );

    console.log(
      process.env.FRONTENDURL + "/auth/create-new-password?token=" + token,
    );
    console.log({ email });
    await sendPasswordResetEmail(
      email,
      user.personal?.fullName as string,
      process.env.FRONTENDURL + "/auth/create-new-password?token=" + token,
    );

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: `Sent to ${email}`,
    });
  } catch (error) {
    console.log({ error });
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const ResetPassword = async (req: Request, res: Response) => {
  try {
    const { password, token } = req.body;
    const userId = verifyToken(token);

    const user = await UserSchema.findById(userId.Id);

    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "No user found!",
      });
    } else if (user.version !== userId.version) {
      return SendResponse(res, {
        success: false,
        statusCode: 460,
        message: "Token already used!",
      });
    }

    const newPassword = await hashPassword(password);
    user.passwordHash = newPassword;
    user.version += 1;
    await user.save();

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Password reset successful",
    });
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
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const GoogleLogin = async (req: Request, res: Response) => {
  try {
    const { idToken } = req.body;

    const response = await axios.get(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      },
    );

    let user = await UserSchema.findOne({ email: response.data.email });
    let message = "";

    if (user) {
      message = "Logged in existing user";
    } else {
      user = new UserSchema({
        email: response.data.email,
        profile: {
          fullName: response.data.name,
          avatarUrl: response.data.picture,
        },
        googleId: response.data.sub,
        emailVerified: true,
      });
      await user.save();
      message = "New user registered";
    }

    const token = jwt.sign({ id: user._id }, process.env.JWTSECRET as string, {
      expiresIn: "30d",
    });

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message,
      data: { user, token },
    });
  } catch (error) {
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const EditPersonalDetailsNoImage = async (
  req: Request,
  res: Response,
) => {
  try {
    const userId = req.authBearerId;

    const flatData = {
      email: req.body.email,
      personal: { ...req.body },
    };

    const user = await UserSchema.findOneAndUpdate(
      { _id: userId },
      { $set: flatData },
      { new: true },
    );

    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User edit successful",
    });
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
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

const ALLOWED_PERSONAL_FIELDS = ["fullName", "phoneNumber"] as const;
export const EditPersonalDetailsWithImage = async (
  req: Request,
  res: Response,
) => {
  let uploadedImageId: string | undefined;

  try {
    const userId = req.authBearerId;
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;

    const update: Record<string, unknown> = {};

    if (req.body.email) update.email = req.body.email;

    for (const key of ALLOWED_PERSONAL_FIELDS) {
      if (req.body[key] !== undefined) {
        update[`personal.${key}`] = req.body[key];
      }
    }

    const avatar = files?.avatarFile?.[0];
    if (avatar) {
      const result = await cloud.uploader.upload(avatar.path);
      uploadedImageId = result.public_id;
      update["personal.avatarUrl"] = result.secure_url;
      update["personal.imageId"] = result.public_id;
    }

    if (Object.keys(update).length === 0) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Nothing to update",
      });
    }

    // new: false returns the document as it was BEFORE the update,
    // which is what we need to find the old image id
    const oldUser = await UserSchema.findOneAndUpdate(
      { _id: userId },
      { $set: update },
      { new: false },
    );

    if (!oldUser) {
      if (uploadedImageId) {
        await cloud.uploader.destroy(uploadedImageId).catch(() => {});
      }
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    const oldImageId = oldUser.personal?.imageId;
    if (uploadedImageId && oldImageId) {
      cloud.uploader.destroy(oldImageId).catch((err: unknown) => {
        console.error("Failed to delete old avatar:", err);
      });
    }

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "User edit successful",
    });
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
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const EditCompanyInfoNoImage = async (req: Request, res: Response) => {
  try {
    const userId = req.authBearerId;

    const user = await UserSchema.findOneAndUpdate(
      { _id: userId },
      { companyInfo: req.body },
      { new: true },
    );

    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Company info edit successful",
      data: user,
    });
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
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};

export const EditUserSecurity = async (req: Request, res: Response) => {
  try {
    const userId = req.authBearerId;

    const user = await UserSchema.findOne({ _id: userId });
    if (!user) {
      return SendResponse(res, {
        success: false,
        statusCode: 404,
        message: "User not found",
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    const passwordMatch = await comparePassword(
      user.passwordHash as string,
      currentPassword,
    );
    if (!passwordMatch) {
      return SendResponse(res, {
        success: false,
        statusCode: 400,
        message: "Invalid current password",
      });
    }

    const newPasswordHash = await hashPassword(newPassword);
    user.passwordHash = newPasswordHash;
    user.version += 1;
    await user.save();

    return SendResponse(res, {
      success: true,
      statusCode: 200,
      message: "Password updated successfully",
    });
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
    return SendResponse(res, {
      success: false,
      statusCode: 500,
      message: "Internal server error",
      data: error,
    });
  }
};
