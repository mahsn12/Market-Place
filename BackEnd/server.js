import express from"express";
import cors from "cors";
import userRouter from "./Routes/UserRoutes.js";
import Database from "./Config/db.js";
import OrderRouter from "./Routes/UserRoutes.js";
import PostController from "./Routes/UserRoutes.js"
import ProductRoutes from "./Routes/ProductRoutes.js"


const app = express();
app.use(cors({ origin: "http://localhost:5173" }));


app.use(express.json());
app.use("/api/users",userRouter);
app.use("/api/orders",OrderRouter);
app.use("/api/posts",PostController);
app.use("/api/products",ProductRoutes);


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