import express from "express";
import { protect } from "../middleware/authmiddleware.js";
import { searchUsers, addContact, getcontacts } from "../controller/authController.js";



const router = express.Router();



router.get("/search",protect,searchUsers)
router.post("/add-contact", protect, addContact);
router.get("/contacts", protect, getcontacts);




export default router