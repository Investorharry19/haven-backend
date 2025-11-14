import UserSchema from "../schema/user.js";
import jwt from "jsonwebtoken";
import Subscription from "../schema/subscriptions.js";
import { sendAccountActivationMail } from "../utils/sendEmail.js";
import { SendResponse } from "../utils/sendResponse.js";
import * as argon2 from "argon2";

//

const hashPassword = async (password) => {
  const result = await argon2.hash(password);
  return result;
};

const comparePassword = async (savedPassword, enteredPassword) => {
  const isMatch = await argon2.verify(savedPassword, enteredPassword);
  return isMatch;
};

//

export const LoginUser = async (req, res) => {
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

    const passwordMatch = await comparePassword(user.passwordHash, password);
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
          Id: result._id,
        },
        process.env.JWTSECRET,
        {
          expiresIn: "10m",
        }
      );
      sendAccountActivationMail(
        user.email,
        user.email,
        process.env.FRONTENDURL +
          "/auth/verify-email?token=" +
          emailConfirmationToken +
          "&email=" +
          user.email
      );

      return SendResponse(res, {
        success: false,
        message: "Email not verified",
        statusCode: 461,
      });
    }

    const token = jwt.sign({ Id: user._id }, process.env.JWTSECRET, {
      expiresIn: "30d",
    });

    const sendUser = {
      ...user._docs,
      Id: user._id.toString(),
      token,
      password: "",
      version: 0,
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

export const CurrentUser = async (req, res) => {
  try {
    const { authorization } = req.headers;
    console.log(authorization);

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const token = authorization.split("Bearer ")[1];
    console.log(14, token);
    const userId = jwt.verify(token, process.env.JWTSECRET);
    const user = await UserSchema.findOne({ _id: userId.Id });

    if (!user) {
      return res.status(404).json({
        message: "user not found",
      });
    }
    const subscriptionData = await Subscription.findOne({ user: user._id });
    res.status(200).json({
      ...user._doc,
      Token: userId.Id,
      Id: userId.Id,
      password: "",
      BusinessId: user?.businessId,
      subscriptionData,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
};
