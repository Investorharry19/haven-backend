import mongoose from "mongoose";

const SubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "haven-users",
    required: true,
  },
  flwSubscriptionId: { type: String, index: true }, // Flutterwave subscription id
  planId: String, // Flutterwave plan id
  amount: Number,
  currency: { type: String, default: "NGN" },
  status: {
    type: String,
    enum: ["active", "inactive", "cancelled", "pending", "failed"],
    default: "pending",
  },
  cardType: String,
  lastFourDigits: Number,
  nextBillingDate: String,
  createdAt: { type: Date, default: Date.now },
  metadata: mongoose.Schema.Types.Mixed,
});

const Subscription = mongoose.model("Subscription", SubscriptionSchema);

export default Subscription;
