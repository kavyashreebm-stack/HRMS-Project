import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, CircleUserRound } from "lucide-react";
import API from "../../../api";

export default function CreateAccountCompact() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [error, setError] = useState("");

  const validatePassword = (pwd) => {
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const hasLength = pwd.length >= 8;
    return hasLower && hasUpper && hasNumber && hasSpecial && hasLength;
  };

  const handleCreateAccount = async () => {
    setError("");

    if (!email || !password || !verifyPassword) {
      setError("All fields are required");
      return;
    }

    if (password !== verifyPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password does not meet requirements");
      return;
    }

    try {
      await API.post("/auth/register", {
        email,
        password,
        role: "CANDIDATE",
      });

      alert("Account created successfully!");
      navigate("/candidate-login");

    } catch (err) {
      console.log(err); // 👈 debug

      setError(
        err.response?.data?.detail || "Registration failed"
      );
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 p-6">

        {/* Heading */}
        <div className="flex flex-col items-center mb-6">
          <CircleUserRound className="w-16 h-16 text-red-600" />
          <h1 className="text-2xl font-semibold mt-2 text-center">
            Create Account
          </h1>
          <p className="text-gray-500 text-xs mt-1 text-center">
            Start your onboarding journey
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type="email"
              placeholder="me@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Verify Password */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Verify Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" />
            <input
              type={showVerifyPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              className="w-full pl-9 pr-9 py-2 rounded-lg border border-gray-300
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
            />
            <button
              type="button"
              onClick={() => setShowVerifyPassword(!showVerifyPassword)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showVerifyPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        {/* Password Rules */}
        <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-medium mb-1">Password Requirements</p>
          <ul className="space-y-1">
            <li>• Uppercase letter</li>
            <li>• Lowercase letter</li>
            <li>• Number</li>
            <li>• Special character</li>
            <li>• Min 8 characters</li>
          </ul>
        </div>

        {/* Button */}
        <button
          onClick={handleCreateAccount}
          className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium
                     hover:bg-red-700 active:scale-[0.98] transition shadow"
        >
          Create Account
        </button>

        {/* Footer */}
        <div className="text-center mt-4 text-xs text-gray-600">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/candidate-login")}
            className="text-blue-600 cursor-pointer hover:underline"
          >
            Sign In
          </span>
        </div>
      </div>
    </div>
  );
}