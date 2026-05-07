import React, { useEffect, useState } from "react";
import {
  Bell,
  UserPlus,
  CheckCircle,
  Calendar,
  AlertCircle,
  Briefcase
} from "lucide-react";
import { getHRApplications } from "../../../../api";

export default function HRNotifications() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await getHRApplications({ limit: 5 });
        const mapped = response.data.slice(0, 5).map(app => ({
          message: "New candidate applied",
          sub: `${app.candidate_profile?.name || "Candidate"} - ${app.department}`,
          type: "New",
          icon: <UserPlus className="text-blue-500" size={18} />
        }));
        setNotifications(mapped);
      } catch (err) {
        console.error("Failed to fetch recent applications:", err);
      }
    };
    fetchRecent();
  }, []);

  const getTypeStyle = (type) => {
    switch (type) {
      case "New":
        return "bg-blue-100 text-blue-600";
      case "Interview":
        return "bg-purple-100 text-purple-600";
      case "Success":
        return "bg-green-100 text-green-600";
      case "Alert":
        return "bg-orange-100 text-orange-600";
      case "Update":
        return "bg-indigo-100 text-indigo-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40">

      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <Bell size={20} />
        Notifications
      </h2>

      <div className="space-y-6 max-h-[280px] overflow-y-auto pr-2">
        {notifications.map((note, index) => (
          <div
            key={index}
            className="flex justify-between items-center p-5 bg-white rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
          >
            {/* Left Content */}
            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-2 rounded-xl">
                {note.icon}
              </div>

              <div>
                <p className="font-semibold text-gray-800">
                  {note.message}
                </p>
                <p className="text-sm text-gray-500">
                  {note.sub}
                </p>
              </div>
            </div>

            {/* Right Badge */}
            <span
              className={`px-4 py-1 text-xs rounded-full font-semibold ${getTypeStyle(
                note.type
              )}`}
            >
              {note.type}
            </span>
          </div>
        ))}
      </div>

    </div>
  );
}