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

/* =========================
   CORS (SAFE FOR VERCEL)
========================= */
app.use(
  cors({
    origin: true, // ✅ allow all origins (Vercel friendly)
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));

/* =========================
   ROUTES
========================= */
app.use("/api/users", userRouter);
app.use("/api/posts", postRoutes);
app.use("/api/messages", MessageRouter);
app.use("/api/offers", OfferRouter);
app.use("/api/ai", aiRoutes);
app.use("/api/orders", orderRoutes);

/* =========================
   RAILWAY REQUIRED
========================= */
const PORT = process.env.PORT || 5000;

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
