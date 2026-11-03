import Router from "express";
import upload from "../utils/multer.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";
import {
  LandlordGetUpdates,
  LandlordSendUpdates,
} from "../controllers/updates.ts";
const UpdatesRouter = Router();

UpdatesRouter.get("/property/landlord-get-updates", LandlordGetUpdates);

UpdatesRouter.post(
  "/property/landlord-send-updates",
  upload.array("file"),
  authMiddleware,
  LandlordSendUpdates,
);

export default UpdatesRouter;
