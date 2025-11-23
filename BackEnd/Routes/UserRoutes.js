import express from "express";
import registerUser from "../Controller/UserController.js";

const router = express.Router();

router.post("/api/users/register",registerUser);

export default router;