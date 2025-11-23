import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    default: "https://via.placeholder.com/200" 
  },
  amountInStock: {
    type: Number,
    required: true,
    min: 0
  },
  sellerId: {
    type:mongoose.Schema.Types.ObjectId,
    ref:"User" ,
    required: true
  },
  category: {
    type: String,
    enum: ["Electronics", "Clothing", "Books", "Furniture", "Food", "Other"], 
    required: true
  }
});

const Product = mongoose.model("Product", productSchema);

export default Product;
