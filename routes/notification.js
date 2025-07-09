import { Router } from "express";
import sendNotification from "../utils/sendNotification.js";

const HavenNotificationRouter = Router();

HavenNotificationRouter.post("/test-notification", async (req, res) => {
  const io = req.app.get("io");

  const userId = "685033c7bc08543c95cf0218";
  const { type, payload } = req.body;

  try {
    console.log("Calling sendNotification...");

    // ✅ Call properly
    await sendNotification({ userId, type, payload }, io);

    res.status(200).json({ message: "Notification sent successfully" });
  } catch (err) {
    console.error("Notification failed:", err);
    res.status(500).json({ error: "Failed to send notification" });
  }
});

export default HavenNotificationRouter;

/**
 * @swagger
 * /test-notification:
 *   post:
 *     summary: Send a notification to a user
 *     tags: [Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - type
 *               - payload
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The ID of the user receiving the notification
 *                 example: "685033c7bc08543c95cf0218"
 *               type:
 *                 type: string
 *                 description: The type/category of the notification
 *                 example: "LEASE"
 *               payload:
 *                 type: object
 *                 description: The content of the notification
 *                 example:
 *                   title: "Lease Expiring Soon"
 *                   message: "The lease for a tenant is nearing its end. Review and take action to renew or close it out."
 *                   sub: "expiring"
 *                   read: false
 *                   date: "4 days ago"
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *       500:
 *         description: Failed to send notification
 */
