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
    this.propertyId = "";
    this.tenantName = data.tenantName || "N/A";
    this.tenantEmailAddress = data.tenantEmailAddress || "";
    this.tenantUnit = data.tenantUnit || "N/A";
    this.tenantGender = data.tenantGender || "Unknown";
    this.tenantPhoneNumber = data.tenantPhoneNumber || "";
    this.leaseFee = parseFloat(data.leaseFee) || 0.0;
    this.leaseCycle = data.leaseCycle || "custom";
    this.startsFrom = data.startsFrom || "1970-01-01";
    this.endsOn = data.endsOn || "1970-01-01";
    this.leaseStatus = data.leaseStatus || "active";
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
      You are an expert lease document parser specializing in real estate agreements. Extract the following information from the provided lease text with high precision.
      
      LEASE CYCLE DETERMINATION:
      - Analyze the start date and end date to calculate the lease cycle
      - Calculate the exact number of days between these dates
      - If the duration is divisible by 7 (e.g., 7, 14, 28 days), it may indicate a weekly pattern
      - If the duration is approximately 30-31 days, it likely indicates a monthly cycle
      - If the duration is approximately 365 days, it indicates a yearly cycle
      - Categorize ONLY as "weekly" (7 days), "bi-weekly" (14 days), "monthly" (28-31 days), "annually " (365 days)
      - Use "custom" ONLY if it doesn't match any of these standard patterns
      
      GENDER IDENTIFICATION:
      - Look for explicit gender indicators such as: "male", "female", "man", "woman"
      - Check pronouns like "he", "she", "him", "her" that may indicate gender
      - Examine honorifics like "Mr.", "Mrs.", "Ms.", "Miss", "Alhaji", "Alhaja"
      - If multiple indicators appear, use the most frequent or most recent reference
      - If no gender indicators are found, report "Unknown"
      
      LEASE STATUS:
      - Always set the lease status to "active" by default unless explicitly stated otherwise
      
      DATE FORMATTING:
      - All dates must be converted to ISO format: YYYY-MM-DD
      - Example: January 15, 2023 should be formatted as 2023-01-15
      - If only partial dates are available, make reasonable inferences
      
      TENANT UNIT EXTRACTION:
      - Analyze the address to identify the specific unit designation
      - Look for unit identifiers like "Flat 1B", "Apartment 303", "Unit 7C", "Room 12"
      - Check for indicators such as "Flat", "Block", "Unit", "Room", "Floor", "Apt", "Apartment"
      - Extract the full unit identifier including both the type and number (e.g., "Flat 1B" not just "1B")
      - If multiple addresses appear, prioritize the one referred to as the tenant's residence
      
      PHONE NUMBER EXTRACTION:
      - Identify phone numbers in various formats (e.g., +1-555-123-4567, (555) 123-4567, 555.123.4567)
      - Include country codes when available
      - If multiple phone numbers are found, prioritize numbers labeled as tenant or primary contact
      - Report the most complete version of the phone number found
      
      EMAIL ADDRESS HANDLING:
      - Search for email patterns (text@domain.com)
      - If no email is found, return an empty string ("")
      - Do not invent or assume email addresses
      
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
          "leaseCycle": "",
          "startsFrom": "",
          "endsOn": "",
          "leaseStatus": "active"
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
