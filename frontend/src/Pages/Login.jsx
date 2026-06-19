import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/axios.js";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore.js";


export default function Login(){
   const navigate = useNavigate();
   const setAuth=useAuthStore((state)=>state.setAuth);

   const [username,setUsername]= useState("")
   const [password,setPassword]= useState("")

  
   const [loading, setLoading]= useState(false)
    
   
   
   const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try{
    const response= await API.post("auth/login",{
      username,
      password
    })
    const {token,...user}=response.data;

    setAuth(user,token);
    toast.success("Login successful");
    navigate("/")
    


    }catch(err){
      toast.error(err.response?.data?.message || "Login failed. Please check your credentials.");
    }
    finally{
      setLoading(false)
    }
  }




  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
      
  {/* Main Container Card */}
  <div className="relative bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-sm border border-gray-800">
    
    {/* Form Heading */}
    <h2 className="text-3xl font-extrabold text-center text-orange-500 mb-6">
      NexaChat Login
    </h2>

    <form onSubmit={handleSubmit} className="space-y-5 relative">
      
      {/* Username Input */}
      <input
        type="text" 
        placeholder="Username" 
        required
        className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {/* Password Input */}
      <input
        type="password" 
        placeholder="Password" 
        required
        className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Submit Button */}
      <button
        type="submit" 
        disabled={loading}
        className="w-full bg-orange-600 text-gray-50 font-bold py-3 rounded-xl hover:bg-orange-500 transition-all duration-300 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Logging in..." : "Login"}
      </button>

    </form>

    {/* Link to Register Page */}
    <p className="mt-6 text-center text-gray-400 font-medium">
      Don't have an account?{' '}
      <Link to="/register" className="text-orange-500 hover:text-orange-400 hover:underline transition-colors">
        Register
      </Link>
    </p>
  </div>
</div> 
  );
};

