import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";

import UserRouter from "./routes/user.js";
import PropertiesRouter from "./routes/property.js";
import MessageRouter from "./routes/messages.js";
import socketHandler from "./utils/socketHandlers.js";
import swaggerJsdoc from "swagger-jsdoc";
import * as swaggerUi from "swagger-ui-express";
import LeaseRouter from "./routes/lease.js";
import FlwWebhook from "./routes/flwWebhook.js";
import HavenNotificationRouter from "./routes/notification.js";
import HavenMaintenanceRouter from "./routes/maintenance.js";
import HavenLeaseRouter from "./routes/lease.js";
import AIExtractionRouter from "./routes/aiExtraction.js";
import SubscriptionRouter from "./routes/subscribe.js";
import WebHooksRouter from "./routes/webhooks.js";
import PerformanceRouter from "./routes/performance.js";
import UpdatesRouter from "./routes/updates.js";

// import

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Haven Properties API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:4000" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

dotenv.config();
const corsOptions = {
  origin: ["http://localhost:3000", "https://haven-backend.onrender.com"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

const app = express();
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(cors(corsOptions));

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "http://localhost:3000");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS,PUT,DELETE");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   next();
// });

app.options("*", cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTENDURL,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  },
});

app.set("io", io);

app.use("/", UserRouter);
app.use("/", PropertiesRouter);
app.use("/", MessageRouter);
app.use("/", LeaseRouter);
app.use("/", FlwWebhook);
app.use("/", HavenNotificationRouter);
app.use("/", HavenMaintenanceRouter);
app.use("/", HavenLeaseRouter);
app.use("/", HavenLeaseRouter);
app.use("/", AIExtractionRouter);
app.use("/", SubscriptionRouter);
app.use("/", WebHooksRouter);
app.use("/", PerformanceRouter);
app.use("/", UpdatesRouter);

io.on("connection", (socket) => {
  socketHandler(io, socket); // <- THIS is calling your socket module
});

async function connectMongo() {
  console.log("Starting");
  try {
    await mongoose.connect(process.env.MONGOCONNECTIONSTRING);
    console.log("CONNECTED");
    server.listen(4000, () => {
      console.log("Server running on port 4000");
    });
    // makeAnalytics();
  } catch (error) {
    console.log(error);
  }
}

connectMongo();
// app.listen(3000, () => {
//   console.log("Server running on port 3000");
// });
