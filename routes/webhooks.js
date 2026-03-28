// routes/webhook.js
import express from "express";
import Subscription from "../schema/subscriptions.js";
import UserSchema from "../schema/user.js";

const WebHooksRouter = express.Router();
function getNextBillingDate(currentDate = new Date()) {
  let next = new Date(currentDate);
  next.setMonth(next.getMonth() + 1);

  if (next.getDate() !== currentDate.getDate()) {
    next.setDate(0);
  }

  return next;
}

WebHooksRouter.post(
  "/flutterwave",
  express.json({ type: "*/*" }),
  async (req, res) => {
    const signature = req.headers["verif-hash"];
    if (!signature || signature !== process.env.FLW_SECRET_HASH) {
      console.warn("Invalid webhook signature");
      return res.status(401).send("Invalid signature");
    }

    const event = req.body;
    // Example event types: charge.completed, subscription.created, subscription.deactivated, etc.
    try {
      const evt = event; // adapt depending on v3 event shape

      // handle a successful recurring charge
      if (
        evt.event === "charge.completed" &&
        evt.data &&
        evt.data.status === "successful"
      ) {
        const email = evt.data.customer?.email;
        // find subscription by Flutterwave subscription id or tx_ref stored earlier
        const flwSubId = evt.data.subscription; // might be present depending on payload
        // fallback: use tx_ref
        const txRef = evt.data.tx_ref;

        let subscription = null;
        if (flwSubId) {
          subscription = await Subscription.findOne({
            flwSubscriptionId: flwSubId,
          });
        }
        if (!subscription && txRef) {
          subscription = await Subscription.findOne({
            "metadata.tx_ref": txRef,
          });
        }

        console.log(evt.data.card);
        if (subscription) {
          subscription.status = "active";
          subscription.cardType = evt.data.card.type;
          subscription.lastFourDigits = evt.data.card.last_4digits;
          subscription.nextBillingDate = getNextBillingDate();

          await subscription.save();

          // set nextChargeDate from event metadata if present
          if (evt.data.next_payment_date)
            subscription.nextChargeDate = new Date(evt.data.next_payment_date);
          await subscription.save();

          // optionally: grant feature access to user etc.
          console.log("Subscription payment processed for", subscription.user);
          const subscribedUser = await UserSchema.findById(subscription.user);
          subscribedUser.subscription = "pro";
          await subscribedUser.save();
        } else {
          console.log("Payment for unknown subscription, email:", email);
          // optionally create or alert
        }
      }

      // subscription deactivated/cancelled event
      if (
        evt.event === "subscription.deactivated" ||
        evt.event === "subscription.cancelled"
      ) {
        const subId = evt.data.id || evt.data.subscription_id;
        const subscription = await Subscription.findOne({
          flwSubscriptionId: subId,
        });
        if (subscription) {
          subscription.status = "cancelled";
          await subscription.save();
          const subscribedUser = await UserSchema.findById(subscription.user);
          subscribedUser.subscription = "free";
          await subscribedUser.save();
        }
      }

      // handle failed charge
      if (evt.event === "charge.failed") {
        const txRef = evt.data.tx_ref;
        const subscription = await Subscription.findOne({
          "metadata.tx_ref": txRef,
        });
        if (subscription) {
          subscription.status = "failed";
          await subscription.save();
          // optionally notify user, retry logic, or mark as suspended
        }
      }

      res.status(200).send("ok");
    } catch (err) {
      console.error("Webhook handler error:", err);
      res.status(500).send("server error");
    }
  },
);

export default WebHooksRouter;
