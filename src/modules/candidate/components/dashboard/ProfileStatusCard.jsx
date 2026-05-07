import React from "react";

export default function ProfileStatusCard({
  completion = 75,
  applicationCompletion = 40,
  name = "Shiva"
}) {

  const radius = 18;
  const circumference = 2 * Math.PI * radius;

  const profileOffset = circumference - (completion / 100) * circumference;
  const applicationOffset =
    circumference - (applicationCompletion / 100) * circumference;

  const firstLetter = name.charAt(0).toUpperCase();

  return (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col">

      <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
        <div className="bg-green-100 p-1 rounded-lg">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
        Status Overview
      </h3>

      <div className="space-y-4 flex-1">

        {/* Profile Status */}
        <div className="flex items-center justify-between bg-white border border-gray-100 shadow-sm p-3.5 rounded-2xl hover:shadow-md transition-all duration-300 group">

          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
              Profile Status
            </span>
            <span className="text-[10px] text-gray-500">Completeness</span>
          </div>

          <div className="flex items-center gap-3">

            <div className="relative flex items-center justify-center">

              <svg width="42" height="42" className="transform -rotate-90">
                <circle
                  cx="21"
                  cy="21"
                  r={16}
                  stroke="#f3f4f6"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="21"
                  cy="21"
                  r={16}
                  stroke="#22c55e"
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={(2 * Math.PI * 16) - (completion / 100) * (2 * Math.PI * 16)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white">
                {firstLetter}
              </div>

            </div>

            <span className="text-sm font-black text-green-600">
              {completion}%
            </span>

          </div>

        </div>


        {/* Application Status */}
        <div className="flex items-center justify-between bg-white border border-gray-100 shadow-sm p-3.5 rounded-2xl hover:shadow-md transition-all duration-300 group">

          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
              Application Status
            </span>
            <span className="text-[10px] text-gray-500">Progress</span>
          </div>

          <div className="flex items-center gap-3">

            <div className="relative flex items-center justify-center">

              <svg width="42" height="42" className="transform -rotate-90">
                <circle
                  cx="21"
                  cy="21"
                  r={16}
                  stroke="#f3f4f6"
                  strokeWidth="3.5"
                  fill="none"
                />
                <circle
                  cx="21"
                  cy="21"
                  r={16}
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 16}
                  strokeDashoffset={(2 * Math.PI * 16) - (applicationCompletion / 100) * (2 * Math.PI * 16)}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shadow-sm ring-2 ring-white">
                A
              </div>

            </div>

            <span className="text-sm font-black text-indigo-600">
              {applicationCompletion}%
            </span>

          </div>

        </div>

      </div>

    </div>

  );
}