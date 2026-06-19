import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/axios.js";
import toast from "react-hot-toast";

export default function Register() {
  const navigate = useNavigate();

  
  // individual input states
  const [firstName, setFirstName]= useState("")
  const [lastName, setLastName]= useState("")
  const [email, setEmail]= useState("")
  const [username, setUsername]= useState("")
  const [password, setPassword]= useState("")

  const [error, setError]= useState("")
  const [loading, setLoading]= useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try{
      await API.post("auth/register", {
        firstName,
        lastName,
        email,
        username,
        password,
        publicKey:"dummy_public_key",  // temparary dummy key
      })

      toast.success("Account created successfully")

      navigate("/login")

    }catch(error){

      toast.error(error.response?.data?.message || "registration failed")
      setError(error.response?.data?.message || "request failed")
      setLoading(false)
    }finally{
      setLoading(false)
    }

  }



  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
      
      {/* Main Container Card */}
      <div className="relative bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
        
        {/* Form Heading */}
        <h2 className="text-3xl font-extrabold text-center text-orange-500 mb-6">
          Create Account
        </h2>
        
        {/* Error Message Display */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg mb-5 text-sm font-medium">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-5 relative">
          
          {/* Name Fields Row */}
          <div className="flex gap-4">
            <input
              type="text" 
              placeholder="First Name" 
              required
              className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <input
              type="text" 
              placeholder="Last Name" 
              required
              className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <input
            type="email" 
            placeholder="Email Address" 
            required
            className="w-full px-4 py-3 bg-gray-950/50 border border-gray-800 text-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500 transition-all placeholder-gray-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

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
            {loading ? "Registering..." : "Register"}
          </button>

        </form>

        {/* Login Page Redirect */}
        <p className="mt-6 text-center text-gray-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-500 hover:text-orange-400 hover:underline transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
    </>
  );
};

