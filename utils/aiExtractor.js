import express from "express";
import multer from "multer";
import pdf from "pdf-parse";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), "uploads");
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Schema validation using Joi or similar could be added here
class HavenLease {
  constructor(data) {
    this.landlordId = data.landlordId || "N/A";
    this.propertyId = data.propertyId || "N/A";
    this.tenantName = data.tenantName || "N/A";
    this.tenantEmailAddress = data.tenantEmailAddress || "example@example.com";
    this.tenantUnit = data.tenantUnit || "N/A";
    this.tenantGender = data.tenantGender || "Unknown";
    this.tenantPhoneNumber = data.tenantPhoneNumber || "N/A";
    this.leaseFee = parseFloat(data.leaseFee) || 0.0;
    this.startsFrom = data.startsFrom || "1970-01-01";
    this.endsOn = data.endsOn || "1970-01-01";
    this.leaseStatus = data.leaseStatus || "pending";
  }
}

export class LLMLeaseExtractor {
  constructor(groqApiKey) {
    this.llm = new ChatGroq({
      apiKey: groqApiKey,
      model: "llama-3.1-8b-instant", // Changed from modelName to model
      temperature: 0.2,
    });
  }

  async extractLeaseInfo(pdfText) {
    const extractionPrompt = `
      You are an expert lease document parser. Extract the following information from the provided lease text.
      Return the information in the following JSON format:
      {
        "HavenLease": {
          "landlordId": "",
          "propertyId": "",
          "tenantName": "",
          "tenantEmailAddress": "",
          "tenantUnit": "",
          "tenantGender": "",
          "tenantPhoneNumber": "",
          "leaseFee": 0,
          "startsFrom": "",
          "endsOn": "",
          "leaseStatus": "pending"
        },
        "UsedLeaseToken": {
          "used": false,
          "createdAt": ""
        }
      }

      Lease Text:
      ${pdfText}
    `;

    try {
      const response = await this.llm.invoke(extractionPrompt);
      const jsonMatch = response.content.match(/```json([\s\S]*?)```/);
      if (!jsonMatch) throw new Error("JSON block not found");
      const fullJson = JSON.parse(jsonMatch[1]); // parse the whole JSON object
      const havenLease = fullJson.HavenLease; // extract just the HavenLease part

      return {
        HavenLease: new HavenLease(havenLease),
        UsedLeaseToken: {
          used: false,
          createdAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error("Error parsing LLM output:", error);
      throw new Error(`Failed to parse LLM output: ${error.message}`);
    }
  }
}

export async function extractTextFromPDF(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found at path: ${filePath}`);
    }

    const dataBuffer = fs.readFileSync(filePath);

    // Add options to handle problematic PDFs
    const options = {
      pagerender: async function pagerender(pageData) {
        // Return text content when possible
        try {
          const textContent = await pageData.getTextContent();
          return textContent.items.map((item) => item.str).join(" ");
        } catch (e) {
          return ""; // Return empty string if text extraction fails
        }
      },
      max: 0, // If 0 then all pages will be rendered
      version: "v2.0.550",
    };

    const data = await pdf(dataBuffer, options);

    if (!data || !data.text || data.text.trim().length === 0) {
      throw new Error("No text content could be extracted from the PDF");
    }

    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", {
      message: error.message,
      details: error.details || "No additional details",
      path: filePath,
    });

    // Rethrow with more descriptive message
    throw new Error(`Failed to process PDF: ${error.message}`);
  }
}
