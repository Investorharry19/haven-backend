import { Router } from "express";
import { sendFlwWebhookEmail } from "../utils/sendEmail.js";
import Subscription from "../schema/subscriptions.js";
import UserSchema from "../schema/user.js";

const FlwWebhook = Router();

FlwWebhook.post("/flw-webhook", async (req, res) => {
  try {
    // Check for the signature
    const secretHash = process.env.FLW_SECRET_HASH;
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== secretHash) {
      // This response is not from Flutterwave; discard
      return res.status(401).end();
    }
    const payload = req.body;
    console.log(payload);

    // Send email to amehharrison202017
    try {
      await sendFlwWebhookEmail(
        "amehharrison202017@gmail.com", // email address
        "Ameh Harrison", // username
        payload
      );
    } catch (emailErr) {
      console.error("Failed to send email:", emailErr);
    }

    res.status(200).end();
  } catch (err) {
    console.log(err.code);
    console.log(err.response?.body);
  }
});

FlwWebhook.get("/flw-webhook", (req, res) => {
  res.status(200).json({ message: "Hello World" });
});

FlwWebhook.post("/flw-payment-completed", async (req, res) => {
  const { transaction_id } = req.body;

  // Verify payment with Flutterwave
  const verifyRes = await fetch(
    `https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    }
  );
  const verifyData = await verifyRes.json();

  if (verifyData.status === "success") {
    const customerEmail = verifyData.data.customer.email;

    // Check if customer already exists
    const customerExist = await Subscription.findOne({ customerEmail });
    if (customerExist) {
      await UserSchema.updateOne(
        { email: customerEmail },
        { $set: { subscription: "paid" } }
      );
      // If customer exists, do not create a new subscription
      return res.status(200).json({
        message: "Customer already exists, subscription not created.",
      });
    }

    // Create subscription plan (if not created already)
    const planRes = await fetch(
      "https://api.flutterwave.com/v3/payment-plans",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Premium Plan",
          amount: 3000, // Recurring charge
          interval: "monthly",
        }),
      }
    );

    const planData = await planRes.json();
    const planId = planData.data.id;

    // Subscribe customer to the plan
    await fetch("https://api.flutterwave.com/v3/subscriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: customerEmail,
        plan: planId,
      }),
    });

    await UserSchema.updateOne(
      { email: customerEmail },
      { $set: { subscription: "paid" } }
    );
    return res.status(200).json({ message: "Subscription started!" });
  }

  return res.status(400).json({ message: "Payment verification failed" });
});

export default FlwWebhook;
