import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, FileText, UserPlus, LogOut, Briefcase } from "lucide-react";
import logo from "../../../../assets/images/AE_Logo.png";

export default function HRSidebar() {
  const navigate = useNavigate();
  const menuItem = (path, Icon, label) => (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm transition ${isActive
          ? "bg-[#0057B8] text-white"
          : "hover:bg-gray-100 text-gray-700"
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className="w-60 bg-white h-screen flex flex-col shadow-sm sticky top-0">

      {/* Logo Section */}
      <div className="bg-[#0057B8] p-4 border-b border-indigo-500">
        <div className="bg-white rounded-lg flex items-center justify-center py-3 shadow-sm">
          <img
            src={logo}
            alt="Company Logo"
            className="h-12 w-auto object-contain"
          />
        </div>
      </div>

      {/* Menu */}
      <div className="flex flex-col flex-1 p-4 space-y-2">
        {menuItem("/hr/dashboard", LayoutDashboard, "Dashboard")}
        {menuItem("/hr/all-applications", FileText, "All Applications")}
        {menuItem("/hr/job-postings", Briefcase, "Job Postings")}
        {menuItem("/hr/onboarding", UserPlus, "Onboarding")}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-auto flex items-center gap-3 w-full px-4 py-2 rounded-lg text-sm transition
                     bg-[#0057B8] text-white hover:bg-gray-700"
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}