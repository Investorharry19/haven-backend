import mongoose, { Schema, mongo } from "mongoose";

const schema = new Schema(
  {
    landlordId: {
      typr: String,
      required: true,
    },
    maintenanceName: {
      type: String,
      require: true,
    },
    afectedUnit: {
      type: String,
      required: true,
    },
    attachments: {
      type: [String],
      default: [],
    },
    attachmentIds: {
      type: [String],
      default: [],
    },
    propertyId: {
      type: String,
      required: true,
    },
    descripton: {
      type: String,
      required: true,
      lowercase: true,
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
