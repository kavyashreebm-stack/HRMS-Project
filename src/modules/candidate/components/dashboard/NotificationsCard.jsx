import React from "react";
import {
  Bell,
  CheckCircle,
  UserPlus,
  AlertCircle,
  Calendar,
  Clock,
  Briefcase,
  User,
  Star,
  Check
} from "lucide-react";

export default function NotificationsCard({ notifications = [], onMarkAllRead }) {
  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Helper to format time (simplified version of "time ago")
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const getIcon = (title, type) => {
    const t = title?.toLowerCase() || "";
    if (t.includes("application") || t.includes("job")) return Briefcase;
    if (t.includes("profile") || t.includes("personal")) return User;
    if (t.includes("offer") || t.includes("selected")) return Star;
    
    switch (type) {
      case "success": return CheckCircle;
      case "urgent": return AlertCircle;
      case "referral": return UserPlus;
      case "calendar": return Calendar;
      default: return Bell;
    }
  };

  const getCategory = (title) => {
    const t = title?.toLowerCase() || "";
    if (t.includes("application") || t.includes("job")) return "Application";
    if (t.includes("profile") || t.includes("section") || t.includes("personal")) return "Profile";
    if (t.includes("interview") || t.includes("schedule")) return "Interview";
    return "System";
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-5 border border-white/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col">

      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <div className="bg-blue-100 p-2 rounded-xl">
            <Bell size={20} className="text-blue-600" />
          </div>
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1 flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
          )}
        </h2>
        
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <button 
              onClick={onMarkAllRead}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
            >
              <Check size={12} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {notifications.length} Total
            </span>
          )}
        </div>
      </div>

      {/* List */}
      <div className="overflow-y-auto pr-2 custom-scrollbar flex-1">
        <div className="space-y-3 pb-2">
          {notifications.length > 0 ? (
            notifications.map((note) => {
              const Icon = getIcon(note.title, note.notification_type);
              const category = getCategory(note.title);
              const isUnread = !note.is_read;
              
              return (
                <div
                  key={note.id}
                  className={`group relative flex items-start gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer border-l-4 ${
                    note.notification_type === "urgent"
                      ? "bg-red-50/30 border-l-red-500 hover:bg-red-50"
                      : note.notification_type === "success"
                      ? "bg-green-50/30 border-l-green-500 hover:bg-green-50"
                      : "bg-white border-l-blue-500 shadow-sm hover:shadow-md"
                  } ${isUnread ? "ring-1 ring-blue-100/50 shadow-blue-50" : "opacity-80 hover:opacity-100"}`}
                >
                  {/* Unread Dot Indicator */}
                  {isUnread && (
                    <div className="absolute top-4 right-4 h-2 w-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
                  )}

                  <div className={`p-2.5 rounded-xl shrink-0 ${
                    note.notification_type === "urgent" ? "bg-red-100 text-red-600" :
                    note.notification_type === "success" ? "bg-green-100 text-green-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    <Icon size={18} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${
                          category === "Application" ? "text-purple-500" :
                          category === "Profile" ? "text-blue-500" :
                          category === "Interview" ? "text-orange-500" : "text-gray-400"
                        }`}>
                          {category}
                        </span>
                        <p className={`text-sm font-bold truncate ${isUnread ? "text-gray-900" : "text-gray-700"}`}>
                          {note.title}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2 flex items-center gap-1 pt-4">
                        <Clock size={10} />
                        {formatTime(note.created_at)}
                      </span>
                    </div>
                    <p className={`text-[12px] leading-relaxed line-clamp-2 ${isUnread ? "text-gray-600 font-medium" : "text-gray-500"}`}>
                      {note.message}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-16 opacity-40">
              <div className="bg-gray-100 p-6 rounded-full mb-4">
                <Bell size={48} className="text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-400">All caught up!</p>
              <p className="text-xs text-gray-400 mt-1">No new notifications to show.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}