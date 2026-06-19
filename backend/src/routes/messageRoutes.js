import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { getMessage, sendMessage, getUnreadCounts, markMessagesAsRead } from "../controller/messageController.js";



const router = express.Router();

router.get("/unread", protect, getUnreadCounts);
router.get("/mark-read/:senderId", protect, markMessagesAsRead);


router.get("/:id", protect, getMessage);
router.post("/send/:id", protect, sendMessage);


export default router