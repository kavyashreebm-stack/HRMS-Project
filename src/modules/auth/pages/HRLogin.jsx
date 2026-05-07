import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Building2
} from "lucide-react";
import API from "../../../api";

export default function HRLogin() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {
      const res = await API.post("/auth/login", {
        email,
        password,
      });

      if (res.data.role !== "HR") {
        setError("This account is not authorized for HR access.");
        return;
      }

      // ✅ Store essential auth data
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("loggedInUser", JSON.stringify({ 
        email, 
        role: res.data.role, 
        id: res.data.user_id 
      }));

      // Redirect to HR dashboard
      navigate("/hr/dashboard");

    } catch (err) {
      setError("Invalid email or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
        className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-2xl shadow-xl p-8 border border-white/40"
      >      {/* Header */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
          <Building2 className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-800">
          HR Login
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Sign in to manage candidates
        </p>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type="email"
            placeholder="hr@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-red-500
                       focus:border-red-500 transition"
            required
          />
        </div>
      </div>

      {/* Password */}
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password <span className="text-red-500">*</span>
        </label>

        <div className="relative">
          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-300
                       focus:outline-none focus:ring-2 focus:ring-red-500
                       focus:border-red-500 transition"
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-2">{error}</p>
      )}

      {/* Login Button */}
      <button
        type="submit"
        className="w-full mt-5 bg-red-600 text-white py-2.5 rounded-lg font-medium
                   hover:bg-red-700 active:scale-[0.99] transition shadow-md
                   flex items-center justify-center gap-2"
      >
        <LogIn className="w-4 h-4" />
        Login
      </button>

      <div className="text-center mt-6 text-sm">
        <p className="text-gray-500">
          HR accounts are created by system admin.
        </p>
      </div>

    </form>
  </div>
);
}