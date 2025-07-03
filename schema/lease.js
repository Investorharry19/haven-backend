import { Schema, model } from "mongoose";

const schema = new Schema(
  {
    landlordId: {
      type: String,
      required: true,
    },
    propertyId: {
      type: String,
      required: true,
    },
    tenantName: {
      type: String,
      required: true,
    },
    tenantEmailAddress: {
      type: String,
      required: true,
    },
    tenantUnit: {
      type: String,
      required: true,
    },
    tenantGender: {
      type: String,
      required: true,
    },
    tenantPhoneNumber: {
      type: String,
      required: true,
    },
    leaseFee: {
      type: Number,
      required: true,
    },
    leaseCycle: {
      type: String,
      required: true,
    },
    startsFrom: {
      type: Date,
      required: true,
    },
    endsOn: {
      type: Date,
      required: true,
    },
    leaseStatus: {
      type: String,
      required: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    avatarPublidId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "pending",
    },
  },
  { timestamps: true }
);

const UsedLeaseTokenSchema = new Schema({
  jti: { type: String, required: true, unique: true },
  used: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 86400 },
});

export const UsedLeaseToken = model("used-lease-token", UsedLeaseTokenSchema);

const HavenLease = model("haven-lease", schema);
export default HavenLease;
