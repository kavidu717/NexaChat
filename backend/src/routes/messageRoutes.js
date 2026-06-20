import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { getMessage, sendMessage, getUnreadCounts, markMessagesAsRead } from "../controller/messageController.js";
import  upload  from "../middleware/upload.js";



const router = express.Router();

router.get("/unread", protect, getUnreadCounts);
router.put("/mark-read/:senderId", protect, markMessagesAsRead);


router.get("/:id", protect, getMessage);
router.post("/send/:id", protect,upload.single("media"), sendMessage);


export default router