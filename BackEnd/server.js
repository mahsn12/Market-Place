import express from "express";
import userRouter from "./Routes/UserRoutes.js";
import Database from "./Config/db.js";
import postRoutes from "./Routes/PostsRouter.js";
import MessageRouter from "./Routes/MessageRouter.js";
import OfferRouter from "./Routes/OfferRouter.js";
import cors from "cors";
import aiRoutes from "./Routes/ai.routes.js";
import orderRoutes from "./Routes/OrderRouter.js";

const app = express();

// ✅ CORS middleware
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : null;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (!allowedOrigins || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

app.use("/api/users", userRouter);
app.use("/api/posts", postRoutes);
app.use("/api/messages", MessageRouter);
app.use("/api/offers", OfferRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/orders", orderRoutes);

// ✅ REQUIRED FOR RAILWAY
const PORT = process.env.PORT || 5200;

try {
  await Database();
  console.log("✅ MongoDB connected successfully");

  app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
  });
} catch (e) {
  console.error("❌ Failed to connect to MongoDB:", e.message);
  process.exit(1);
}
