import HavenProperties from "../schema/property.js";
import { Router } from "express";
import upload from "../utils/multer.js";
import cloud from "../utils/cloudinary.js";
import { promisify } from "util";
import jwt from "jsonwebtoken";
import HavenLease from "../schema/lease.js";
import { SendResponse } from "../utils/sendResponse.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const PropertiesRouter = Router();

// schema

/**
 * @swagger
 * components:
 *   schemas:
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Indicates if the request was successful
 *           example: true
 *         message:
 *           type: string
 *           description: Optional message about the response
 *           example: "Info about request"
 *         data:
 *           type: object
 *           nullable: true
 *           description: Optional data returned by the API
 *           example: {}
 */

// get all properties
/**
 * @swagger
 * /dashboard/get-property:
 *   get:
 *     summary: Retrieve all properties for the authenticated user
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid token in header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       460:
 *         description: Token already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       461:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
PropertiesRouter.get(
  "/dashboard/get-property",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.authBearerId;

      const properties = await HavenProperties.find({ userId });

      return SendResponse(res, {
        success: true,
        data: properties,
        message: "Properties retrieved successfully",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return SendResponse(res, {
          success: false,
          statusCode: 460,
          message: "Token already used!",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return SendResponse(res, {
          success: false,
          statusCode: 461,
          message: "Invalid token!",
        });
      }
      return SendResponse(res, {
        success: false,
        statusCode: 500,
        message: "Internal server error",
        data: error,
      });
    }
  },
);

PropertiesRouter.post(
  "/dashboard/add-property",
  upload.fields([{ name: "images" }]),
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.authBearerId;

      let imageUrl = [];
      let imageIdS = [];
      await Promise.all(
        req.files.images.map(async (image) => {
          const uploadPromise = promisify(cloud.uploader.upload);
          const result = await uploadPromise(image.path);
          imageUrl.push(result.secure_url);
          imageIdS.push(result.public_id);
        }),
      );

      const newProperty = new HavenProperties({
        userId,
        propertyImagesUrl: imageUrl[0],
        propertyImagesId: imageIdS[0],
        ...req.body,
      });

      await newProperty.save();

      return SendResponse(res, {
        success: true,
        data: newProperty,
        message: "Property added successfully",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return SendResponse(res, {
          success: false,
          statusCode: 460,
          message: "Token already used!",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return SendResponse(res, {
          success: false,
          statusCode: 461,
          message: "Invalid token!",
        });
      }
      return SendResponse(res, {
        success: false,
        statusCode: 500,
        message: "Internal server error",
        data: error,
      });
    }
  },
);

/**
 * @swagger
 * /dashboard/add-property:
 *   post:
 *     summary: Add a new property for the authenticated user
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Property images
 *               title:
 *                 type: string
 *                 description: Property title
 *               description:
 *                 type: string
 *                 description: Property description
 *               price:
 *                 type: number
 *                 description: Property price
 *               location:
 *                 type: string
 *                 description: Property location
 *     responses:
 *       200:
 *         description: Property added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid token in header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       460:
 *         description: Token already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       461:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
PropertiesRouter.patch(
  "/dashboard/edit-property/:propertyId",
  upload.fields([{ name: "images" }]),
  authMiddleware,
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.authBearerId;

      const newProperty = req.body;

      if (req.files && req.files.images) {
        const oldProperty = await HavenProperties.findOne({
          userId: userId,
          _id: propertyId,
        });

        await Promise.all(
          req.files.images.map(async (image) => {
            const uploadPromise = promisify(cloud.uploader.upload);
            const result = await uploadPromise(image.path);
            newProperty.propertyImagesUrl = result.secure_url;
            newProperty.propertyImagesId = result.public_id;
          }),
        );

        cloud.uploader
          .destroy(oldProperty.propertyImagesId)
          .then(async (result) => {});
      }

      const property = await HavenProperties.findOneAndUpdate(
        { userId: userId, _id: propertyId },

        { $set: newProperty },
        { new: true },
      );

      if (!property) {
        return res.status(404).json({
          message: "Property with this Id not found",
        });
      }
      res.status(200).json({ message: "Property edit sucessful", property });
    } catch (error) {
      if (error.name == "TokenExpiredError") {
        return res.status(460).json({ message: "Token already used!" });
      }
      if (error.name === "JsonWebTokenError") {
        return res.status(461).json({ message: "invalid token!" });
      }
      res.status(500).json(error);
    }
  },
);

/**
 * @swagger
 * /dashboard/delete-property/{propertyId}:
 *   delete:
 *     summary: Delete a property by its ID for the authenticated user
 *     tags:
 *       - Properties
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the property to delete
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Invalid token in header
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       404:
 *         description: Property with this ID not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       460:
 *         description: Token already used
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       461:
 *         description: Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
PropertiesRouter.delete(
  "/dashboard/delete-property/:propertyId",
  authMiddleware,
  async (req, res) => {
    try {
      const { propertyId } = req.params;
      const userId = req.authBearerId;

      const property = await HavenProperties.findOneAndDelete({
        userId: userId,
        _id: propertyId,
      });

      if (!property) {
        return SendResponse(res, {
          success: false,
          statusCode: 404,
          message: "Property with this Id not found",
        });
      }

      // Delete property image from cloud
      await cloud.uploader.destroy(property.propertyImagesId);

      // Delete related leases and their avatars
      const leases = await HavenLease.find({ propertyId });
      await Promise.all(
        leases.map((lease) => cloud.uploader.destroy(lease.avatarPublidId)),
      );
      await Promise.all(
        leases.map((lease) => HavenLease.deleteOne({ _id: lease._id })),
      );

      return SendResponse(res, {
        success: true,
        message: "Property deleted successfully",
      });
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return SendResponse(res, {
          success: false,
          statusCode: 460,
          message: "Token already used!",
        });
      }
      if (error.name === "JsonWebTokenError") {
        return SendResponse(res, {
          success: false,
          statusCode: 461,
          message: "Invalid token!",
        });
      }
      return SendResponse(res, {
        success: false,
        statusCode: 500,
        message: "Internal server error",
        data: error,
      });
    }
  },
);

export default PropertiesRouter;
