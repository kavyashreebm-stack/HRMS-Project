import React from "react";
import { Eye } from "lucide-react";

export default function HRApplicationsTable({ applications, updateStatus, onView }) {

  const getStatusColor = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-100 text-blue-700";
      case "Application Reviewed":
        return "bg-yellow-100 text-yellow-700";
      case "Interview Scheduled":
        return "bg-purple-100 text-purple-700";
      case "On Hold":
        return "bg-gray-200 text-gray-700";
      case "Offered":
        return "bg-green-200 text-green-700";
      case "Onboarding":
        return "bg-orange-200 text-orange-700";
      default:
        return "bg-gray-200 text-gray-600";
    }
  };

  const statusFlow = [
    "Applied",
    "Application Reviewed",
    "Interview Scheduled",
    "On Hold",
    "Offered",
    "Onboarding",
  ];

  return (
    <div className="overflow-x-auto bg-white rounded-xl shadow-md">

      <table className="min-w-full ">

        {/* HEADER */}
        <thead>
          <tr className="bg-gray-50 text-gray-700 text-sm shadow-sm">
            <th className="px-4 py-3 text-left">Candidate</th>
            <th className="px-4 py-3 text-left">Job Applied</th>
            <th className="px-4 py-3 text-left">Date Applied</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-transparent">

          {applications.map((app) => (
            <tr
              key={app.id}
              className="hover:bg-gray-50 transition shadow-sm"
            >

              <td className="px-4 py-3 font-medium text-gray-800">
                {app.candidate_profile?.name || "Unknown Candidate"}
              </td>

              <td className="px-4 py-3">{app.job}</td>

              <td className="px-4 py-3 text-gray-500">
                {app.date}
              </td>

              {/* STATUS */}
              <td className="px-4 py-3">
                <select
                  value={app.status}
                  onChange={(e) => updateStatus(app.id, e.target.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm focus:outline-none ${getStatusColor(app.status)}`}
                >
                  {statusFlow.map((status) => {
                    const currentIndex = statusFlow.indexOf(app.status);
                    const optionIndex = statusFlow.indexOf(status);

                    return (
                      <option
                        key={status}
                        value={status}
                        disabled={optionIndex > currentIndex + 1} // only next allowed
                      >
                        {status}
                      </option>
                    );
                  })}
                </select>
              </td>

              {/* ACTION */}
              <td className="px-4 py-3">
                <button
                  onClick={() => onView && onView(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0057B8] text-white text-sm font-medium hover:bg-[#0046a3] transition"
                >
                  <Eye size={16} />
                  View
                </button>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}