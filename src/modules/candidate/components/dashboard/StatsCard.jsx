import React from "react";

export default function StatsCard({ title, value, icon: Icon, color = "blue" }) {

  const colors = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    orange: "bg-orange-100 text-orange-600",
    green: "bg-green-100 text-green-600"
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm
    flex items-center gap-4 hover:shadow-lg hover:scale-[1.06] transition-all duration-300">

      {Icon && (
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={18} />
        </div>
      )}

      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>

    </div>
  );
}