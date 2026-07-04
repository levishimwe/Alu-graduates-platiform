// backend/tests/health.test.js
// Basic health check test to verify the API is set up correctly

const request = require("supertest");
const app = require("../app");
const mongoose = require("mongoose");

afterAll(async () => {
  await mongoose.connection.close();
});

describe("Health Check", () => {
  it("GET /api/health should return 200 and status OK", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("OK");
  });

  it("GET / should return API info", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBeDefined();
  });
});