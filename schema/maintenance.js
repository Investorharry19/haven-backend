import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    propertyId: {
      type: String,
      required: true,
    },
    propertyName: {
      type: String,
      required: true,
      lowercase: true,
    },
    propretyLocation: {
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
      type: [String],
      default: [],
    },
    propertyImagesIds: {
      type: [String],
      default: [],
    },
    descripton: {
      type: String,
      required: true,
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

const HavenMaintenance = mongoose.model("haven-maintenance", schema);

export default HavenMaintenance;
