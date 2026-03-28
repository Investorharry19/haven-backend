import Router from "express";
import upload from "../utils/multer.js";
import { authMiddleware } from "../utils/authMiddleware.js";
import {
  LandlordGetUpdates,
  LandlordSendUpdates,
} from "../controllers/updates.js";
const UpdatesRouter = Router();

UpdatesRouter.get("/property/landlord-get-updates", LandlordGetUpdates);

UpdatesRouter.post(
  "/property/landlord-send-updates",
  upload.array("file"),
  authMiddleware,
  LandlordSendUpdates,
);

export default UpdatesRouter;
