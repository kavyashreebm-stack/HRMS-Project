import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../../../assets/images/AE_Logo.png";
import {
  HomeIcon, UserIcon, FileIcon, //DeclarationIcon,//
  LogoutIcon
} from "../../../../assets/icons/AllIcons";

export default function CandidateSidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const menuItem = (id, Icon, label) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition ${activeTab === id
          ? "bg-red-500 text-white"
          : "hover:bg-gray-400 text-gray-700"
        }`}
    >
      <Icon size={22} />
      <span>{label}</span>
    </button>
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className="w-60 bg-white h-screen flex flex-col shadow-sm sticky top-0">

      {/* Logo Section */}
      <div className="bg-red-500 p-4 border-b border-red-500">
        <div className="bg-white rounded-lg flex items-center justify-center py-2 shadow-sm">
          <img
            src={logo}
            alt="Company Logo"
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex flex-col flex-1 p-4 space-y-2">

        {menuItem("home", HomeIcon, "Home")}
        {menuItem("profile", UserIcon, "Profile")}
        {menuItem("application", FileIcon, "Applications")}


        {/* 🔴 Bottom Logout */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 w-full text-left px-4 py-2 rounded-lg transition
                     bg-red-500 text-white hover:bg-gray-400 hover:text-gray-700"
        >
          <LogoutIcon size={22} />
          <span>Logout</span>
        </button>

      </div>

    </aside>
  );
}