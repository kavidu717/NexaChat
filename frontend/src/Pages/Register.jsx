import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../utils/axios.js";

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

      navigate("/login")

    }catch(error){
      setError(error.response?.data?.message || "request failed")
      setLoading(false)
    }finally{
      setLoading(false)
    }

  }



  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Create Account</h2>
        
        {/* Display error message if there is one */}
        {error && <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="flex gap-4">
            {/* First Name Input */}
            <input
              type="text" 
              placeholder="First Name" 
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {/* Last Name Input */}
            <input
              type="text" 
              placeholder="Last Name" 
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          {/* Email Input */}
          <input
            type="email" 
            placeholder="Email Address" 
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* Username Input */}
          <input
            type="text" 
            placeholder="Username" 
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          {/* Password Input */}
          <input
            type="password" 
            placeholder="Password" 
            required
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* Submit Button */}
          <button
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition duration-200 disabled:bg-blue-300"
          >
            {loading ? "Registering..." : "Register"}
          </button>

        </form>

        {/* Link to Login Page */}
        <p className="mt-4 text-center text-slate-600">
          Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
    </>
  );
};

