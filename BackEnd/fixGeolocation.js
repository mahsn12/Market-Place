import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.mongoURL);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error.message);
    process.exit(1);
  }
};

const fixGeolocation = async () => {
  try {
    await connectDB();

    // Drop the old 2dsphere index if it exists
    try {
      await mongoose.connection.collection("posts").dropIndex("location_2dsphere");
      console.log("✅ Successfully dropped old 2dsphere index on posts.location");
    } catch (error) {
      if (error.message.includes("index not found")) {
        console.log("✅ Index already removed or doesn't exist");
      } else {
        throw error;
      }
    }

    // Update all posts with old GeoJSON location to simple string
    const result = await mongoose.connection.collection("posts").updateMany(
      { location: { $exists: true, $type: "object" } },
      { $set: { location: "" } }
    );

    console.log(
      `✅ Updated ${result.modifiedCount} posts with old location format to empty string`
    );

    // Close connection
    await mongoose.connection.close();
    console.log("✅ Database cleanup completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during cleanup:", error.message);
    process.exit(1);
  }
};

fixGeolocation();
