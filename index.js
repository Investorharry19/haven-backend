import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";
import http from "http";
import swaggerUI from "swagger-ui-express";
import { swaggerSpec } from "./utils/swagger.js";

import UserRouter from "./routes/user.js";
import PropertiesRouter from "./routes/property.js";
import socketHandler from "./utils/socketHandlers.js";
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

dotenv.config();
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://haven-backend.onrender.com",
    "https://haven-frontend-chi.vercel.app",
    "https://haven-frontend-jpzs.onrender.com",
  ],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
};

const app = express();
app.use(
  "/api-docs",
  swaggerUI.serve,
  swaggerUI.setup(swaggerSpec, {
    tagsSorter: (a, b) => {
      const order = ["Auth", "Users", "Products", "Other"];
      return order.indexOf(a) - order.indexOf(b);
    },
  }),
);
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

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Haven Backend API</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .container {
          text-align: center;
          background-color: white;
          padding: 50px;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #333;
        }
        p {
          color: #666;
          font-size: 18px;
        }
        a {
          display: inline-block;
          margin-top: 20px;
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
        }
        a:hover {
          background-color: #0056b3;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Haven Backend API</h1>
        <p>Your Property Management Solution</p>
        <a href="/api-docs">View API Documentation</a>
      </div>
    </body>
    </html>
  `);
});

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
