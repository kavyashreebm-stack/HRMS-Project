import React from "react";
import CandidateSidebar from "./CandidateSidebar";
import { Bell, UserCircle } from "lucide-react";


export default function CandidateLayout({ children, activeTab, setActiveTab, unreadCount, userName }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <CandidateSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Right Section */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">

        {/* Modern Topbar */}
        <div className="h-24 bg-white shadow-sm flex items-center justify-between px-8 shrink-0">

          {/* Left Section */}
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
              Candidate Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage Your Profile & Applications Efficiently
            </p>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-6">

            {/* Notification Badge */}
            <div className="relative cursor-pointer p-2 hover:bg-gray-50 rounded-full transition-colors group">
              <Bell size={24} className="text-gray-600 group-hover:text-indigo-600" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 bg-red-500 text-white text-[10px] font-bold items-center justify-center rounded-full ring-2 ring-white">
                  {unreadCount}
                </span>
              )}
            </div>

            {/* Profile */}
            <div className="flex items-center gap-3 cursor-pointer">

              <UserCircle size={30} className="text-indigo-600" />

              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-800">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">
                  Active Candidate
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Fixed Content - Removed main page scrollbar */}
        <div className="flex-1 overflow-hidden p-6">
          {children}
        </div>

      </div>
    </div>
  );
}