import HavenProperties from "../schema/property.js";
import { Router } from "express";
import upload from "../utils/multer.js";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";

const PropertiesRouter = Router();

// get all properties
PropertiesRouter.get("/dashboard/get-property", async (req, res) => {
  try {
    const { authorization } = req.headers;

    if (!authorization || authorization.length < 10) {
      return res.status(400).json({ message: "Invalid token in header" });
    }

    const token = authorization.split("Bearer ")[1];
    const userId = jwt.verify(token, process.env.JWTSECRET).Id;

    const properties = await HavenProperties.find({ userId });

    res.status(200).json(properties);
  } catch (error) {
    console.log(error);
    if (error.name == "TokenExpiredError") {
      console.log("WWWWWWWWWWWWWWWWWWW");
      return res.status(460).json({ message: "Token already used!" });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(461).json({ message: "invalid token!" });
    }
    res.status(500).json(error);
  }
});

/**
 * @swagger
 * /dashboard/get-property:
 *   get:
 *     summary: Retrieve properties for the logged-in user
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       400:
 *         description: Invalid token in header
 *       460:
 *         description: Token already used
 *       461:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */

PropertiesRouter.post(
  "/dashboard/add-property",
  upload.fields([{ name: "images" }]),
  async (req, res) => {
    try {
      const { authorization } = req.headers;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET).Id;

      let imageUrl = [];
      let imageIdS = [];
      await Promise.all(
        req.files.images.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = await uploadPromise(image.path);
          imageUrl.push(result.secure_url);
          imageIdS.push(result.public_id);
        })
      );

      const newProperty = new HavenProperties({
        userId,
        propertyImagesUrl: imageUrl[0],
        propertyImagesId: imageIdS[0],
        ...req.body,
      });

      await newProperty.save();

      res.status(200).json(newProperty);
    } catch (error) {
      console.log(error);
      if (error.name == "TokenExpiredError") {
        console.log("WWWWWWWWWWWWWWWWWWW");
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  }
);

PropertiesRouter.patch(
  "/dashboard/edit-property/:propertyId",
  upload.fields([{ name: "images" }]),
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { propertyId } = req.params;
      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const newProperty = req.body;

      if (req.files && req.files.images) {
        const oldProperty = await HavenProperties.findOne({
          userId: userId.Id,
          _id: propertyId,
        });

        await Promise.all(
          req.files.images.map(async (image) => {
            const uploadPromise = promisify(cloud.uploader.upload);
            const result = await uploadPromise(image.path);
            newProperty.propertyImagesUrl = result.secure_url;
            newProperty.propertyImagesId = result.public_id;
          })
        );

        cloud.uploader
          .destroy(oldProperty.propertyImagesId)
          .then(async (result) => {});
      }

      const property = await HavenProperties.findOneAndUpdate(
        { userId: userId.Id, _id: propertyId },

        { $set: newProperty },
        { new: true }
      );

      if (!property) {
        return res.status(404).json({
          message: "Property with this Id not found",
        });
      }
      res.status(200).json({ message: "Property edit sucessful", property });
    } catch (error) {
      console.log(error);
      if (error.name == "TokenExpiredError") {
        console.log("WWWWWWWWWWWWWWWWWWW");
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  }
);

PropertiesRouter.delete(
  "/dashboard/delete-property/:propertyId",
  async (req, res) => {
    try {
      const { authorization } = req.headers;
      const { propertyId } = req.params;

      if (!authorization || authorization.length < 10) {
        return res.status(400).json({ message: "Invalid token in header" });
      }

      const token = authorization.split("Bearer ")[1];
      const userId = jwt.verify(token, process.env.JWTSECRET);

      const property = await HavenProperties.findOneAndDelete({
        userId: userId.Id,
        _id: propertyId,
      });

      if (!property) {
        return res.status(404).json({
          message: "Property with this Id not found",
        });
      }

      cloud.uploader
        .destroy(property.propertyImagesId)
        .then(async (result) => {});

      res.status(200).json({ message: "Property Deleted sucessful" });
    } catch (error) {
      console.log(error);
      if (error.name == "TokenExpiredError") {
        console.log("WWWWWWWWWWWWWWWWWWW");
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  }
);

/**
 * @swagger
 * /dashboard/add-property:
 *   post:
 *     summary: Upload a new property with images
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - propertyName
 *               - propretyLocation
 *               - country
 *               - numberOfUnits
 *               - propertyType
 *               - descripton
 *               - images
 *             properties:
 *               propertyName:
 *                 type: string
 *                 example: Ocean View Apartment
 *               propretyLocation:
 *                 type: string
 *                 example: lekki phase 1
 *               country:
 *                 type: string
 *                 example: nigeria
 *               numberOfUnits:
 *                 type: integer
 *                 example: 12
 *               propertyType:
 *                 type: string
 *                 example: duplex
 *               descripton:
 *                 type: string
 *                 example: beautiful home close to the beach
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Property successfully created
 *       400:
 *         description: Invalid token in header
 *       460:
 *         description: Token already used
 *       461:
 *         description: Invalid token
 *       500:
 *         description: Internal server error
 */

export default PropertiesRouter;
