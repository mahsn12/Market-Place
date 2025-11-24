import express from "express";
import {registerUser,DeleteUser,GetUser,UpdateUser,getAllUsers,loginUser} from "../Controller/UserController.js";

const router = express.Router();

router.post("/register",registerUser);
router.post("/login",loginUser);
router.delete("/delete/:id",DeleteUser);
router.get("/get/:id",GetUser);
router.get("/getAll",getAllUsers);
router.put("/update/:id",UpdateUser);

export default router;