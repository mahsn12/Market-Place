import mongoose from "mongoose";
import dot from "dotenv";

dot.config();

// Fail fast if we cannot talk to Mongo instead of buffering
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

const DB = async () => {
  const mongoUrl = process.env.mongoURL;

  if (!mongoUrl) {
    throw new Error("mongoURL is not set in .env");
  }

  try {
    await mongoose.connect(mongoUrl, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 20000,
    });

    console.log("✅ MongoDB Connected Successfully");

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err.message);
    });
  } catch (error) {
    console.error("❌ Cannot connect to MongoDB:", error.message);
    throw error;
  }
};

export default DB;
