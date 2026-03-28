// routes/subscribe.js
import express from "express";
import axios from "axios";
import Subscription from "../schema/subscriptions.js";
import UserSchema from "../schema/user.js";

const SubscriptionRouter = express.Router();
const FLW = process.env.FLW_SECRET_KEY;

SubscriptionRouter.post("/api/subscribe/create-sub", async (req, res) => {
  const { userId, currency = "NGN", name, email } = req.body;
  if (!userId) return res.status(400).json({ error: "missing fields" });

  const tx_ref = `sub_${userId}_${Date.now()}`;

  try {
    const amount = 6.99 * 1500;
    const { data } = await axios.post(
      "https://api.flutterwave.com/v3/payments",
      {
        tx_ref,
        amount,
        currency,
        redirect_url: `${process.env.FRONTENDURL}/dashboard/settings`,
        customer: { email, name },
        payment_plan: "224742",
      },
      {
        headers: {
          Authorization: `Bearer ${FLW}`,
          "Content-Type": "application/json",
        },
      },
    );

    // Save a pending subscription record tied to tx_ref (optional but recommended)
    const user = await UserSchema.findById(userId);
    const sub = await Subscription.create({
      user: user._id,
      planId: "224742",
      amount,
      currency,
      status: "pending",
      metadata: { tx_ref },
    });

    return res.json({
      status: data.status,
      data: data.data,
      localSubscriptionId: sub._id,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).json({ error: "failed to start payment" });
  }
});

export default SubscriptionRouter;

// ...existing code...

/**
 * @swagger
 * /api/subscribe/create-sub:
 *   post:
 *     summary: Create a new subscription payment
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - planId
 *               - amount
 *               - name
 *               - email
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user creating subscription
 *               planId:
 *                 type: string
 *                 description: ID of the subscription plan
 *               amount:
 *                 type: number
 *                 description: Amount for the subscription
 *               currency:
 *                 type: string
 *                 default: NGN
 *                 description: Currency code (defaults to NGN)
 *               name:
 *                 type: string
 *                 description: Customer's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *     responses:
 *       200:
 *         description: Subscription payment initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     link:
 *                       type: string
 *                       description: Payment link URL
 *                 localSubscriptionId:
 *                   type: string
 *                   description: ID of the created subscription record
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: missing fields
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: failed to start payment
 */
