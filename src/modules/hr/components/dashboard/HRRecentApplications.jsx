import React, { useEffect, useState } from "react";
import { Bell, UserPlus, Clock, CheckCircle, Briefcase } from "lucide-react";
import { getHRApplications } from "../../../../api";

export default function HRNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        // ✅ Only fetch 5 most recent — uses ?limit=5 on backend
        const response = await getHRApplications({ limit: 5, summary: true });
        const mapped = response.data.slice(0, 5).map(app => ({
          message: `${app.candidate_profile?.name || "A candidate"} applied`,
          sub: `Department: ${app.department || "—"} · ${app.experience_type || ""}`,
          type: app.status || "New",
          time: app.created_at ? new Date(app.created_at).toLocaleDateString("en-IN") : "",
        }));
        setNotifications(mapped);
      } catch (err) {
        console.error("Failed to fetch recent applications:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const getTypeStyle = (type) => {
    if (type.includes("Onboard")) return "bg-emerald-100 text-emerald-700";
    if (type.includes("Offer")) return "bg-green-100 text-green-700";
    if (type.includes("Interview")) return "bg-purple-100 text-purple-700";
    if (type.includes("Reviewed")) return "bg-yellow-100 text-yellow-700";
    if (type.includes("Hold")) return "bg-gray-100 text-gray-600";
    return "bg-blue-100 text-blue-600";
  };

  const getIcon = (type) => {
    if (type.includes("Onboard") || type.includes("Offer")) return <CheckCircle size={16} className="text-emerald-500" />;
    if (type.includes("Interview")) return <Clock size={16} className="text-purple-500" />;
    if (type.includes("Reviewed")) return <Briefcase size={16} className="text-yellow-600" />;
    return <UserPlus size={16} className="text-blue-500" />;
  };

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40">
      <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
        <Bell size={20} />
        Recent Activity
      </h2>

      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {loading ? (
          // ✅ Skeleton while loading
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-8">No recent applications.</p>
        ) : (
          notifications.map((note, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 p-2 rounded-xl">{getIcon(note.type)}</div>
                <div>
                  <p className="font-semibold text-sm text-gray-800">{note.message}</p>
                  <p className="text-xs text-gray-500">{note.sub}</p>
                  {note.time && <p className="text-xs text-gray-400 mt-0.5">{note.time}</p>}
                </div>
              </div>
              <span className={`px-3 py-1 text-xs rounded-full font-semibold whitespace-nowrap ${getTypeStyle(note.type)}`}>
                {note.type}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}