const express = require("express");
const fetch = require("node-fetch");

const router = express.Router();

const HF_MODEL_URL =
  "https://router.huggingface.co/hf-inference/models/google/vit-base-patch16-224";

router.post("/detect-category", async (req, res) => {
  try {
    const HF_API_KEY = process.env.AIKEY;

    if (!HF_API_KEY) {
      console.error("❌ AIKEY is missing");
      return res.status(500).json({ message: "AIKEY is missing" });
    }

    const { images } = req.body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: "No images provided" });
    }

    const img = images[0];
    const parts = img.split(",");

    if (parts.length !== 2) {
      return res.status(400).json({ message: "Invalid image format" });
    }

    const base64 = parts[1];

    const response = await fetch(HF_MODEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ inputs: base64 }),
    });

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(500).json({ message: "Hugging Face API error", data });
    }

    const topLabel = data[0]?.label?.toLowerCase() || "";

    const mapCategory = (label) => {
      if (label.includes("phone") || label.includes("computer")) return "electronics";
      if (label.includes("chair") || label.includes("table")) return "furniture";
      if (label.includes("shirt") || label.includes("clothing")) return "fashion";
      if (label.includes("book")) return "books";
      if (label.includes("sport") || label.includes("ball")) return "sports";
      if (label.includes("car") || label.includes("vehicle")) return "vehicles";
      return "other";
    };

    res.json({
      category: mapCategory(topLabel),
      rawLabel: topLabel,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "AI detection failed" });
  }
});

module.exports = router;
