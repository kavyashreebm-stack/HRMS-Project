import React from "react";
import { Eye } from "lucide-react";
import { FILE_BASE_URL } from "../../../../api";

export default function HRApplicationsCards({ app, onView }) {
  const isOnboarding = app.status === "Onboarding";
  const baseClasses = "bg-white p-4 rounded-xl shadow-sm border transition-all duration-300";
  const standardClasses = "border-gray-100 hover:shadow-md hover:scale-[1.03]";
  const onboardingClasses = "border-emerald-200 hover:border-emerald-500 hover:shadow-emerald-100 hover:shadow-lg hover:scale-[1.03]";
  
  const photoPath = app.candidate_profile?.photo_path;
  const photoUrl = photoPath ? `${FILE_BASE_URL}/${photoPath}` : null;
  const initials = (app.candidate_profile?.name || "?").charAt(0).toUpperCase();

  return (
    <div className={`${baseClasses} ${isOnboarding ? onboardingClasses : standardClasses}`}>

      {/* Candidate Header with Photo */}
      <div className="flex items-center gap-3 mb-3">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={app.candidate_profile?.name || "Candidate"}
            className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 flex-shrink-0"
            onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; e.target.nextSibling.style.display = "flex"; }}
          />
        ) : null}
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-sm flex-shrink-0 ${photoUrl ? "hidden" : "flex"}`}
        >
          {initials}
        </div>

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