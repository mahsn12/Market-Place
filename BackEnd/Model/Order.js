import mongoose from "mongoose";
 
const orderSchema = mongoose.Schema({
    name:{
        type:mongoose.Schema.Types.ObjectId,
    }
});