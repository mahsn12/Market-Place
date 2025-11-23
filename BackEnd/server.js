import express from"express";
import userRouter from "./Routes/UserRoutes.js";
import Database from "./Config/db.js";

const app = express();

app.use(express.json());
app.use("/api/users",userRouter);

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