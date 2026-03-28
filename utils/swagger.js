// swagger.js
import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Haven Properties API",
      version: "1.0.0",
    },
    tags: [
      { name: "Lease", description: "Haven Lease endpoints" },
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Properties", description: "Proprties Endpoints" },
    ],

    servers: [{ url: process.env.BACKENDURL }],
    components: {
      schemas: {},
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

export const swaggerSpec = swaggerJsdoc(options);
