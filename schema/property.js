import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
      lowercase: true,
    },
    propertyLocation: {
      type: String,
      required: true,
      lowercase: true,
    },
    country: {
      type: String,
      required: true,
      lowercase: true,
    },
    numberOfUnits: {
      type: Number,
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
      lowercase: true,
    },
    propertyImagesUrl: {
      type: String,
    },
    propertyImagesId: {
      type: String,
    },
    description: {
      type: String,
      lowercase: true,
    },
    vacantUnits: {
      type: Number,
      default: 0,
    },
    pendingUnits: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

const HavenProperties = mongoose.model("haven-properties", schema);

export default HavenProperties;
