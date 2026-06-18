import Message from "../models/message.js";


export const sendMessage=async(req,res)=>{
    try{

        const {encryptedText,messageType="text",mediaUrl=""}=req.body


        // receiver
        const {id:receiverId}=req.params

        // sender
        const {id:senderId}=req.user._id

        if(!encryptedText){
             return
              res.status(400).
              json({
                 success: false, message: "Message content is required" 
                });
        }


        // save message in the data base
        const message=await Message.create({
            senderId,
            receiverId,
            encryptedText,
            messageType,
            mediaUrl
        })

        res.status(200).
        json({
            success:true,
            message:"Message sent successfully"
        })

    }catch(error){
        console.log(error)
        res.status(500).
        json({
            message:"Internal server error"
        })
    }
}

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