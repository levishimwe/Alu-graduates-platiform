const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ALU Graduates Empowerment Platform API",
      version: "1.0.0",
      description:
        "API documentation for the ALU Graduate Showcase & Investor Portal",
    },
    servers: [
      {
        url: process.env.API_BASE_URL || "http://localhost:5000/api",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ["./routes/*.js"],
};

const swaggerDocument = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerDocument };