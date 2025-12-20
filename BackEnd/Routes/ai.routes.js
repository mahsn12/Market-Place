import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// =====================================
// PUT YOUR HUGGING FACE TOKEN HERE
// =====================================
const HF_API_KEY = "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";

// Free image classification model
const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224";

router.post("/detect-category", async (req, res) => {
  try {
    const { images } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    // Use only the first image
    const img = images[0];
    const [meta, base64] = img.split(",");

    if (!base64) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    // Call Hugging Face
    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: base64,
      }),
    });

    const data = await response.json();

    if (!Array.isArray(data)) {
      console.error("HF error:", data);
      return res.status(500).json({
        message: "Hugging Face API error",
        data,
      });
    }

    // Top prediction
    const topLabel = data[0]?.label?.toLowerCase() || "";

    // Map labels → marketplace categories
    const mapCategory = (label) => {
      if (label.includes("phone") || label.includes("computer"))
        return "electronics";
      if (label.includes("chair") || label.includes("table"))
        return "furniture";
      if (label.includes("shirt") || label.includes("clothing"))
        return "fashion";
      if (label.includes("book"))
        return "books";
      if (label.includes("ball") || label.includes("sport"))
        return "sports";
      if (label.includes("car") || label.includes("vehicle"))
        return "vehicles";
      if (label.includes("toy"))
        return "toys";
      if (label.includes("house") || label.includes("home"))
        return "home";

      return "other";
    };

    const category = mapCategory(topLabel);

    return res.json({
      category,
      rawLabel: topLabel,
      modelUsed: "google/vit-base-patch16-224",
    });
  } catch (err) {
    console.error("AI route error:", err);
    return res.status(500).json({ message: "AI detection failed" });
  }
});

export default router;
