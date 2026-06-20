import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
   
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    encryptedText:{
        type:String,
       
    },
    isRead:{
        type:Boolean,
        default:false
    },
    messageType:{
        type:String,
        enum:["text","image","video","file"],
        default:"text"
    },
    mediaUrl:{
        type:String,
        default:""
    }

},{timestamps:true}
)


const Message = mongoose.model("Message", messageSchema);
export default Message;