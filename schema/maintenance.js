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
      required: true,
    },
    requestImagePublicIds: {
      type: [String],
      required: true,
    },
    propertyId: {
      typr: String,
      required: true,
    },
    landlordId: {
      typr: String,
      required: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const HavenMaintenance = mongoose.model("haven-maintenance", schema);

export default HavenMaintenance;
