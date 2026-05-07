import React from "react";
import HRApplicationsCards from "./HRApplicationsCards";

const columns = [
  { title: "Applied", color: "bg-blue-100 text-blue-700" },
  { title: "Application Reviewed", color: "bg-yellow-100 text-yellow-700" },
  { title: "Interview Scheduled", color: "bg-purple-100 text-purple-700" },
  { title: "On Hold", color: "bg-gray-200 text-gray-700" },
  { title: "Offered", color: "bg-green-200 text-green-700" },
  { title: "Onboarding", color: "bg-emerald-200 text-emerald-700" }
];

export default function HRApplicationsKanban({ applications, onView }) {
  return (
    <div className="grid grid-cols-3 gap-6">

      {columns.map((column) => (
        <div
          key={column.title}
          className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300"
        >

          {/* Column Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-700">
              {column.title}
            </h2>

            <span
              className={`text-xs px-2 py-1 rounded-full ${column.color}`}
            >
              {
                applications.filter((a) => a.status === column.title)
                  .length
              }
            </span>
          </div>

          {/* Cards */}
          <div className="space-y-4">
            {applications
              .filter((a) => a.status === column.title)
              .map((app) => (
                <HRApplicationsCards
                  key={app.id}
                  app={app}
                  onView={onView}
                />
              ))}
          </div>

        </div>
      ))}

    </div>
  );
}