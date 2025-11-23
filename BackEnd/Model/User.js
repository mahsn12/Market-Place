import mongoose from "mongoose";

const userSchema = mongoose.Schema({
    name:{
        type: String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        minlength:8
    },
    role:{
        type:String,
        enum :["Buyer", "Seller", "Admin"],
        default :'Buyer'
    },
    profileImage:{
        type:String,
        default : 'https://png.pngtree.com/png-vector/20221130/ourmid/pngtree-user-profile-button-for-web-and-mobile-design-vector-png-image_41767880.jpg'
    },
    phone:{
        type:String
    }
});

const user = mongoose.model("User",userSchema);
export default user;