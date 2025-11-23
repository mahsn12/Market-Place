import { request, response } from "express";
import User from "../Model/User.js";
import encrypt from "bcryptjs";

export const registerUser = async (request,response)=>{
    try{
        const { name, email, password, role, phone } = request.body;

        const existUser = await User.findOne({email});

        if(existUser){
            return response.status(400).json({
                message:"User Name Exists"
            }); 
        }
        const user = new User({
            name : name,
            email : email,
            password : await encrypt.hash(password,10),
            role:role,
            phone:phone
        });

        await user.save();
        return response.status(201).json({
            message:"User registered successfully",
            name : user.name
        });
    }
    catch(e){
        return response.status(500).json({
            message:e.message
        });
    }
};
export const getAllUsers = async (request,response)=>{
    try{
        const users = await User.find();//return array
        return response.status(200).json({
            message:"All Users were retrived",
            result:users
        });
    }
    catch(e){
        return response.status(500).json({
            message:e.message
        });
    }
}

export const GetUser = async (request,response)=>{
    try{
        const {id} = request.params;
        //const user = await User.find({id:id});//return array
       // if(user.length === 0) u should check for the array length
       const user = await User.findById(id);//returns id
        if(!user){
            return response.status(404).json({
                message:"User Not Found"
            });
        }
        return response.status(200).json({
            message:"User found",
            result:user
        });
    }
    catch(e){
          return response.status(500).json({
            message:e.message
        });
    }
    
}

export const UpdateUser = async (request,response) => { //Post Request , params -> id , body ->stuff
    try{
        const {id} = request.params;
        const updates = request.body;
        const isUpdated = await User.findByIdAndUpdate(id,updates,//name:moh , phone: ... -> findByIdAndUpdate(12x , {name:moh , phone: 01125})
            {
                new:true,
                runValidators : true
            }
        );
        if(!isUpdated){
            return response.status(404).json({
                message:"Not Found"
            }); 
        }
        return response.status(200).json({
            message:"User Updated"  
        });
    }
    catch(e){
    return response.status(500).json({
            message:e.message
        });
    }
}

export const DeleteUser = async (request, response) => {
    try {
        const { id } = request.params;

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return response.status(404).json({
                message: "User Not Found"
            });
        }

        return response.status(200).json({
            message: "User Deleted Successfully"
        });

    } catch (e) {
        return response.status(500).json({
            message: e.message
        });
    }
};

