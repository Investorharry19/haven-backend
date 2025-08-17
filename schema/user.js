import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
    },

    personal: {
      fullName: String,
      avatarUrl: String,
      phoneNumber: String,
      imageId: String,
    },
    companyInfo: {
      companyName: String,
      companyWebsite: String,
    },
    subscription: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    emailVerified: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const UserSchema = mongoose.model("haven-users", schema);

export default UserSchema;
