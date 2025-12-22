import mongoose from "mongoose";


// Fail fast if we cannot talk to Mongo instead of buffering
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

const DB = async () => {
  const mongoUrl = "mongodb+srv://MarketUser1:JoWaUK3H71voSpSwMUqYSLzv6LdMDRes4iLpRTT2f2Kx7GMrOlkAGX1UhEgDcFCUphfmCr2vIoPVsZV6IV2AOKVV3Bu9t2ZRBSyp9xl8AaB0ZShEmEHrdLEj6ipXhPBqJyA4BylADuFah9IuPehF1A9MdhDqLlzbXTahxs4IATW0s7Jw8u04luGa27OeoyXbiM3CDtdiBD96IWFICvXfiuzPbs8dOywl00foCR2QdOfH8ChMYtSidM53zE2UQIjwtL1KF5WO2E2xo30AYQRjKjZ3xaMRWDma9qzHPShguB9bAl16Pp3APqyAoXB36RY9VSa4dW91C85IwkLXvyftewX@marketplace.tkn4exv.mongodb.net/?appName=MarketPlace";

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
