import React from "react";
import { Bell, Search, UserCircle } from "lucide-react";

export default function HRTopbar() {
  return (
    <div className="h-24 bg-white/70 backdrop-blur-xl border-b border-white/40 flex items-center justify-between px-10 shadow-md">
      
      <div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          HR Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage recruitment & onboarding efficiently
        </p>
      </div>

        <div className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 px-4 py-2 rounded-2xl transition">
          <UserCircle size={30} className="text-indigo-600" />
          <div>
           
            <p className="text-xs text-gray-500">
              HR Manager
            </p>
          </div>
        </div>
      </div>
    
  );
}