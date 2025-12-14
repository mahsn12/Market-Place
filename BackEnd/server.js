import express from "express";
import userRouter from "./Routes/UserRoutes.js";
import Database from "./Config/db.js";
import PostController from "./Routes/PostsRouter.js";
import MessageRouter from "./Routes/MessageRouter.js";
import OfferRouter from "./Routes/OfferRouter.js";
import cors from "cors";

const app = express();
// ✅ CORS middleware — allow configured origins or fall back to any origin for dev use
const allowedOrigins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // non-browser or same-origin
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
app.use("/api/posts", PostController);
app.use("/api/messages", MessageRouter);
app.use("/api/offers", OfferRouter);

try {
  await Database();
  console.log("✅ MongoDB connected successfully");

  app.listen(5200, () => console.log("✅ APP Runs Succesfully on Port 5200"));
} catch (e) {
  console.error("❌ Failed to connect to MongoDB:", e.message);
  process.exit(1);
}
