import express from "express";
import registerUser from "../Controller/UserController";

const router = express.Router();

router.post("/register",registerUser);