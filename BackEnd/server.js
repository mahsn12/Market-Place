import express from"express";
import userRouter from "./Routes/UserRoutes.js";
import Database from "./Config/db.js";
import OrderRouter from "./Routes/OrderRouter.js";
import PostController from "./Routes/PostsRouter.js"
import productRoutes from "./Routes/ProductsRouter.js"
import cors from "cors";

const app = express();
// ✅ CORS middleware — put it here
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use("/api/users",userRouter);
app.use("/api/orders",OrderRouter);
app.use("/api/posts",PostController);
app.use("/api/products", productRoutes);


try{
    await Database();
    console.log("✅ MongoDB connected successfully");

    app.listen(5200,()=>
        console.log("✅ APP Runs Succesfully on Port 5200"));

}
catch(e){
    console.error("❌ Failed to connect to MongoDB:", e.message);
    process.exit(1);
}