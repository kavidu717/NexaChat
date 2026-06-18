import User from "../models/user.js";



export const serchUsers=async(req,res)=>{
    try{

        const keyword=req.query.search

        if(!keyword){
            res.status(400)
            .json({message:"Please enter a search keyword"})

        }
        
        // find the users
       const users=await User.find({_id:{$ne:req.user._id},username:{$regex:keyword,$options:"i"}}).select("firstName lastName username email")
     
       res.status(200)
       .json({
        success:true,
        users
       })


    }catch(error){
        console.log(error)

        res.status(500)
        .json(
            {message:"Internal server error"

            })
    }
}

export const addContact=async(req,res)=>{


    try{

        const {contactId}=req.body

        const user=await User.findById(req.user._id)

        // check the friend is alreafy in the contact list
        if(user.contacts.includes(contactId)){
            res.status(400)
            .json({
                success:false,
                message:"this user is already in your contact list"
            })
        }

        // add the friend to the contact list
        user.contacts.push(contactId)
        await user.save()

        res.status(200)
        .json({
            success:true,
            message:"contact added successfully"})



    }catch(error){
        console.log(error)
        res.status(500).
        json({
            success:false,
            message:"Internal server error"
        })
    }
}

export const getcontacts=async(req,res)=>{
    try{

        const user=await User.findById(req.user._id).populate("contacts","firstName lastName username email")
        res.status(200)
        .json({
            success:true,
            contacts:user.contacts
        })

    }catch(error){
        console.log(error)
        res.status(500).
        json({
            success:false,
            message:"Internal server error"
        })
    }
}