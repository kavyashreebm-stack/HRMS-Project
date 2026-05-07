import React from "react";
import { Eye } from "lucide-react";

export default function HRApplicationsCards({ app, onView }) {
  const isOnboarding = app.status === "Onboarding";
  const baseClasses = "bg-white p-4 rounded-xl shadow-sm border transition-all duration-300";
  const standardClasses = "border-gray-100 hover:shadow-md hover:scale-[1.03]";
  const onboardingClasses = "border-emerald-200 hover:border-emerald-500 hover:shadow-emerald-100 hover:shadow-lg hover:scale-[1.03]";

  return (
    <div className={`${baseClasses} ${isOnboarding ? onboardingClasses : standardClasses}`}>

      {/* Candidate Header */}
      <div className="flex items-center gap-3 mb-3">

        <div>
          <p className="font-semibold text-gray-800">{app.candidate_profile?.name || "Unknown Candidate"}</p>
          <p className="text-sm text-gray-500">{app.department}</p>
        </div>

      </div>

      {/* Details */}
      <div className="text-sm text-gray-600 space-y-1">
        <p>Email: {app.candidate_profile?.email || "N/A"}</p>
        <p>Experience: {app.experience_type}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-end mt-4">

        <button
          onClick={() => onView(app)}
          className="flex items-center gap-1 text-sm bg-[#0057B8] text-white px-3 py-1.5 rounded-md hover:bg-[#0047a3] transition"
        >
          <Eye size={16} />
          View Details
        </button>

      </div>

    </div>
  );
}