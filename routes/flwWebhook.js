import { Router } from "express";

import {
  FlutterwavePaymentCimpleted,
  FlutterwaveWebhookPost,
} from "../controllers/flwWebhook.js";

const FlwWebhook = Router();

FlwWebhook.post("/flw-webhook", FlutterwaveWebhookPost);

FlwWebhook.post("/flw-payment-completed", FlutterwavePaymentCimpleted);

export default FlwWebhook;
