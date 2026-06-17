import {create} from "zustand";
 
 const useAuthStore = create((set) => ({
    authUser: null,
    token:localStorage.getItem("chat_token") || null,

    // after login save data
    setAuth:(user,token)=>{
        localStorage.setItem("chat_token",token);
        set({authUser:user,token:token})
    },

    // after logout remove data
    logout:()=>{
        localStorage.removeItem("chat_token");
        set({authUser:null,token:null})
    }
    
    
 }));


 
 export default useAuthStore