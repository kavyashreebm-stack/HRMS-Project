import React from "react";
import { useNavigate } from "react-router-dom";
import bgg from "../../../assets/images/b.png";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-black font-sans">

      {/* HERO SECTION - Full screen */}
      <section className="relative flex-1 flex items-center justify-center text-center overflow-hidden py-10">

        {/* Background Image */}
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            backgroundImage: `url(${bgg})`,
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            filter: "brightness(45%)" // Match exact darkness of the screenshot background
          }}
        />

        {/* Content Panel (The black box in the middle) */}
        <div className="relative z-10 bg-[rgba(0,0,0,0.7)] px-6 py-8 sm:px-10 md:px-10 md:py-8 rounded-lg shadow-2xl w-[90%] max-w-[600px] mx-auto">

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-lg mb-4">
            HR Management System
          </h2>

          <p className="text-[#cccccc] text-sm sm:text-base md:text-md max-w-xl mx-auto drop-shadow-md mb-8">
            “Real-Time Employee Insights and Intelligent Recruitment for Workforce Excellence.”
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 md:gap-8 justify-center items-center">
            <button
              onClick={() => navigate("/candidate-login")}
              className="w-full sm:w-auto px-6 py-3 bg-[#e62e2d] text-white text-[16px] font-semibold rounded hover:bg-red-700 transition shadow-lg"
            >
              Candidate Login
            </button>

            <button
              onClick={() => navigate("/hr-login")}
              className="w-full sm:w-auto px-6 py-3 bg-[#e62e2d] text-white text-[16px] font-semibold rounded hover:bg-red-700 transition shadow-lg"
            >
              HR Login
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

