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
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden">
      
      {/* පිටුපසින් පෙනෙන ලස්සන කොළ පැහැති Ambient Glow එක (පින්තූරයේ තිබුණා වගේ) */}
      <div className="absolute w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Dark Glassmorphism Card */}
      <div className="relative bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800">
        
        {/* Neon Green Heading */}
        <h2 className="text-3xl font-extrabold text-center text-emerald-400 mb-6 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]">
          Create Account
        </h2>
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/50 text-red-400 p-3 rounded-lg mb-5 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative">
          
          <div className="flex gap-4">
            {/* First Name Input */}
            <input
              type="text" 
              placeholder="First Name" 
              required
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {/* Last Name Input */}
            <input
              type="text" 
              placeholder="Last Name" 
              required
              className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <input
            type="email" 
            placeholder="Email Address" 
            required
            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Username Input */}
          <input
            type="text" 
            placeholder="Username" 
            required
            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Password Input */}
          <input
            type="password" 
            placeholder="Password" 
            required
            className="w-full px-4 py-3 bg-slate-950/50 border border-slate-800 text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all placeholder-slate-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Submit Button with Neon Green Glow */}
          <button
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 text-slate-50 font-bold py-3 rounded-xl hover:bg-emerald-500 transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Registering..." : "Register"}
          </button>

        </form>

        {/* Link to Login Page */}
        <p className="mt-6 text-center text-slate-400 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors drop-shadow-[0_0_5px_rgba(52,211,153,0.3)]">
            Login
          </Link>
        </p>
      </div>
    </div>
    </>
  );
};

