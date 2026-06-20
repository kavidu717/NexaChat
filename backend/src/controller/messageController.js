import Message from "../models/message.js";
import { io, getReceiverSocketId } from "../utils/sockts.js";
import{v2 as cloudinary} from "cloudinary";
import streamifier from "streamifier";


cloudinary.config({
    cloud_name:"doujmzgn3",
    api_key:"757791128176963",
    api_secret:"hXz4HtIOAlRmg22jQF0s2WOyXIo",
});

export const sendMessage = async (req, res) => {
    try {
        let { encryptedText = "" } = req.body;

        // receiver
        const { id: receiverId } = req.params;

        // sender
        const senderId = req.user._id;

        let mediaUrl = "";
        let messageType = "text";

        // Check if either text OR a file is provided
        if (!encryptedText && !req.file) {
            return res.status(400).json({
                success: false, 
                message: "Message content or media is required" 
            });
        }

        // If a file is attached, upload it to Cloudinary
        if (req.file) {
            const isVideo = req.file.mimetype.startsWith("video");
            const resourceType = isVideo ? "video" : "image";
            messageType = isVideo ? "video" : "image";

            const streamUpload = (req) => {
                return new Promise((resolve, reject) => {
                    let stream = cloudinary.uploader.upload_stream(
                        { resource_type: resourceType, folder: "nexachat_media" },
                        (error, result) => {
                            if (result) {
                                resolve(result);
                            } else {
                                reject(error);
                            }
                        }
                    );
                    streamifier.createReadStream(req.file.buffer).pipe(stream);
                });
            };

            const result = await streamUpload(req);
            mediaUrl = result.secure_url;
        }

        // save message in the data base
        const message = await Message.create({
            senderId,
            receiverId,
            encryptedText,
            messageType,
            mediaUrl
        });

        // send message to the receiver
        const receiverSocketId = getReceiverSocketId(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", message);
        }

        res.status(200).json({
            success: true,
            message: message
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
};

export const getMessage=async(req,res)=>{

    try{

        const {id:userToChatId}=req.params

         const myId=req.user._id

       // to find message 
         const messages=await Message.find({$or:[{senderId:userToChatId,receiverId:myId},{senderId:myId,receiverId:userToChatId}]}).sort({createdAt:1})


        res.status(200).
        json({
            success:true,
            messages
        })
        
    }catch(error){
        console.log(error),
        res.status(500).
        json({
            message:"Internal server error"
        })
    }
}

// Get unread message counts grouped by sender
export const getUnreadCounts = async (req, res) => {
    try {
        const myId = req.user._id;

        // Find unread messages sent to me and group them by sender
        const unreadCounts = await Message.aggregate([
            { $match: { receiverId: myId, isRead: false } },
            { $group: { _id: "$senderId", count: { $sum: 1 } } }
        ]);

        // Convert the result into an easy-to-use object
        const countsMap = {};
        unreadCounts.forEach(item => {
            countsMap[item._id.toString()] = item.count;
        });

        res.status(200).json(countsMap);
    } catch (error) {
        console.error("Error in getUnreadCounts", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Mark messages from a specific sender as read
export const markMessagesAsRead = async (req, res) => {
    try {
        const myId = req.user._id;
        const { senderId } = req.params;

        // Update all unread messages from this sender to read
        await Message.updateMany(
            { senderId: senderId, receiverId: myId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json({ success: true, message: "Messages marked as read" });
    } catch (error) {
        console.error("Error in markMessagesAsRead", error);
        res.status(500).json({ error: "Internal server error" });
    }
};