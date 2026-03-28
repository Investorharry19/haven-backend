import { Router } from "express";

import upload from "../utils/multer.js";
import FormData from "form-data";
import axios from "axios";
import fs from "fs";
import jwt from "jsonwebtoken";
import { LLMLeaseExtractor, extractTextFromPDF } from "../utils/aiExtractor.js";
import { authMiddleware } from "../utils/authMiddleware.js";

const AIExtractionRouter = Router();

AIExtractionRouter.post(
  "/landlord/extract",
  upload.fields([{ name: "document" }]),
  authMiddleware,
  async (req, res) => {
    try {
      if (!req.files || !req.files.document[0].path.endsWith(".pdf")) {
        return res
          .status(400)
          .json({ error: "Invalid file type. Only PDF files are allowed." });
      }

      const pdfText = await extractTextFromPDF(req.files.document[0].path);
      if (!pdfText) {
        return res
          .status(500)
          .json({ error: "Could not extract text from PDF." });
      }

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res
          .status(500)
          .json({ error: "GROQ_API_KEY not found in environment variables." });
      }

      const extractor = new LLMLeaseExtractor(groqApiKey);
      const extractedData = await extractor.extractLeaseInfo(pdfText);

      // Clean up temporary file
      fs.unlinkSync(req.files.document[0].path);

      res.json(extractedData);
    } catch (error) {
      console.error("Error processing request:", error);
      res
        .status(500)
        .json({ error: `Internal server error: ${error.message}` });
    }

    // try {
    //   const file = req.files.document[0];
    //   const form = new FormData();
    //   form.append("file", fs.createReadStream(file.path), file.originalname);

    //   const response = await axios.post(
    //     "https://pdf-lease-1.onrender.com/extract-lease-info/",
    //     form,
    //     {
    //       headers: form.getHeaders(),
    //     }
    //   );

    //   const returnData = {
    //     ...response.data,
    //     landlordId: userId,
    //     propertyId: req.body.propertyId,
    //   };
    //   res.status(200).json(returnData);
    // } catch (error) {
    //   console.error("Error in AIExtractionRouter:", error);
    //   res.status(500).json({ error: "Internal Server Error" });
    // }
  },
);

export default AIExtractionRouter;

/**
 * @swagger
 * /landlord/extract:
 *   post:
 *     summary: Extract lease info from uploaded document
 *     tags:
 *       - USE AI
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: The PDF document to upload
 *     responses:
 *       200:
 *         description: Extraction result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       500:
 *         description: Internal Server Error
 */
// ...existing code...
