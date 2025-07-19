import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    requestCategory: {
      type: String,
      required: true,
    },
    requestType: {
      type: String,
      required: true,
    },
    affectedUnit: {
      type: String,
      required: true,
    },
    estimatedCost: {
      type: Number,
      required: true,
    },
    requestDescription: {
      type: String,
      required: true,
    },
    requestImages: {
      type: [String],
      default: [],
    },
    requestImagePublicIds: {
      type: [String],
      default: [],
    },
    propertyId: {
      type: String,
      required: true,
    },
    landlordId: {
      type: String,
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const HavenMaintenance = mongoose.model("maintenance", schema);

export default HavenMaintenance;
