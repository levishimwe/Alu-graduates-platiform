const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "";

let connection = null;

const connect = async () => {
  if (!MONGO_URI) {
    console.warn("⚠️  No MONGO_URI set, skipping MongoDB connection.");
    return false;
  }

  if (connection) return true;

  try {
    const options = {
      dbName: "alu_platform",
      ...(process.env.NODE_ENV === "test" ? { serverSelectionTimeoutMS: 2000 } : {}),
    };
    await mongoose.connect(MONGO_URI, options);
    connection = mongoose.connection;
    console.log("✅ MongoDB connected successfully.");
    return true;
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
    return false;
  }
};

module.exports = { connect, mongoose };