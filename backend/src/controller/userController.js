import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser=async(req,res)=>{
    try{
        const {firstName,lastName,email,username,password,publicKey}=req.body;

        // check the all field are fill
        if(!firstName || !lastName || !email || !username || !password || !publicKey){
            res.status(400).
            json({
                success:false,
                message:"please fill the all field"
            })
        }

        // check the user already exist
        const userExist=await User.findOne({username});
        if(userExist){
            res.status(400).
            json({
                success:false,
                message:"user already exist"
            })

        }
     // create the user
        const user=await User.create({
            firstName,
            lastName,
            email,
            username,
            password,
            publicKey
        })
     if(user){
        res.status(200).
        json({
            success:true,
            _id:user._id,
            firstName:user.firstName,
            lastName:user.lastName,
            email:user.email,
            message:"user registration successfull please login"
        })
     }else{
        res.status(400).
        json({
            success:false,
            message:"user registration failed"
        })
     }
    }catch(error){
        console.log(error);
        res.status(500).
        json({
            success:false,
            message:"Internal Server Error"
        })
    }
}

export const loginUser=async(req,res)=>{
    try{

        const {username,password}=req.body;

        // check the all field are fill
        if(!username || !password){
            res.status(400).
            json({
                success:false,
                message:"please fill the all field"
            })
        }
        
        // find the user in the database
        const user=await User.findOne({username});
        if(user && (await bcrypt.compare(password,user.password))){

            // create the token
            const token=jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:"30d"});

            res.status(200).
            json({
                success:true,
                _id:user._id,
                firstName:user.firstName,
                lastName:user.lastName,
                email:user.email,
                username:user.username,
                token:token,
            

        }
    )
}    else{
        res.status(400).
        json({
            success:false,
            message:"username or password is incorrect"
        })
     }

    }catch(error){
        console.log(error);
        res.status(500).
        json({
            success:false,
            message:"Internal Server Error"
        })
    }
}