import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { getMessage, sendMessage } from "../controller/messageController.js";



const router = express.Router();


router.get("/:id", protect, getMessage);
router.post("/send/:id", protect, sendMessage);


export default router