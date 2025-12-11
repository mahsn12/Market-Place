import Product from "../Model/Product.js";

//================ CREATE PRODUCT ==================
export const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      condition,
      images,
      location,
    } = req.body;

    if (!name || !description || !price || !category || !stock) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const product = await Product.create({
      sellerId: req.user.id,
      name,
      description,
      price,
      stock,
      category,
      condition,
      images,
      locationString: location,
    });

    return res.status(201).json({
      message: "Product created successfully",
      result: product,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findOne({ _id: id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Only owner can update
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const updateData = { ...req.body, lastModfied: Date.now() };
    if (req.body.location) {
      updateData.locationString = req.body.location;
      delete updateData.location;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    return res.status(200).json({
      message: "Product updated",
      result: updatedProduct,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Only seller can delete
    if (product.sellerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await Product.findByIdAndDelete(id);

    return res.status(200).json({ message: "Product deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("sellerId", "name email profileImage")
      .populate("savedBy", "_id name"); //hatgeeb el 7agat bta3t el refrence id

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.status(200).json(product);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const filterAndSearch = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, searchQuery } = req.query;

    // Default values using parseInt
    const min = minPrice ? parseInt(minPrice) : 0;
    const max = maxPrice ? parseInt(maxPrice) : 999999999;

    const results = await Product.find({
      ...(searchQuery && { name: { $regex: searchQuery, $options: "i" } }),
      ...(category && { category }),
      price: { $gte: min, $lte: max },
    }).populate("sellerId", "name email profileImage");

    if (!results || results.length === 0) {
      return res
        .status(404)
        .json({ message: "No Products Applied on the filter" });
    }

    return res.status(200).json(results);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const getProductsBySeller = async (req, res) => {
  try {
    const sellerId = req.params.sellerId;

    if (!sellerId) {
      return res.status(400).json({ message: "Seller ID is required" });
    }

    const products = await Product.find({ sellerId })
      .populate("sellerId", "name email profileImage")
      .sort({ createdAt: -1 });

    return res
      .status(200)
      .json({ message: "Products retrieved", result: products });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

export const reportProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "Reason required" });
    }

    const userId = req.user.id; // secure

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReported = product.reports.some(
      (r) => r.userId.toString() === userId
    );

    if (alreadyReported) {
      return res
        .status(400)
        .json({ message: "You already reported this product" });
    }

    product.reports.push({
      userId,
      reason,
      date: Date.now(),
    });

    await product.save();

    return res.status(200).json({ message: "Report submitted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};
