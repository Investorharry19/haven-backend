import { Router } from "express";
import type { Request, Response } from "express";
import fs from "fs";
import upload from "../utils/multer.ts";
import { LLMLeaseExtractor, extractTextFromPDF } from "../utils/aiExtractor.ts";
import { authMiddleware } from "../utils/authMiddleware.ts";

const AIExtractionRouter = Router();

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

AIExtractionRouter.post(
  "/landlord/extract",
  authMiddleware, // auth first, so unauthenticated requests don't write files to disk
  upload.fields([{ name: "document", maxCount: 1 }]),
  async (req: Request, res: Response) => {
    const files = req.files as
      | Record<string, Express.Multer.File[]>
      | undefined;
    const file = files?.document?.[0];

    try {
      if (!file || !file.originalname.toLowerCase().endsWith(".pdf")) {
        return res
          .status(400)
          .json({ error: "Invalid file type. Only PDF files are allowed." });
      }

      const pdfText = await extractTextFromPDF(file.path);
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

      return res.json(extractedData);
    } catch (error) {
      console.error("Error processing request:", error);
      return res
        .status(500)
        .json({ error: `Internal server error: ${errorMessage(error)}` });
    } finally {
      // Always clean up the temp file, even on errors
      if (file) {
        await fs.promises.unlink(file.path).catch(() => {});
      }
    }
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
