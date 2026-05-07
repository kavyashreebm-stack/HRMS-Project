import React from "react";
import { FiSearch, FiFilter, FiGrid, FiList } from "react-icons/fi";

export default function HRApplicationsFilters({
  search,
  setSearch,
  status,
  setStatus,
  view,
  setView,
}) {
  return (
    <div className="w-full bg-white p-4 rounded-xl shadow-md mb-6">

      <div className="flex items-center justify-between">

        {/* LEFT SECTION */}
        <div className="flex items-center gap-4 w-full">

          {/* SEARCH */}
          <div className="relative w-[280px] md:w-[320px] shadow-sm rounded-lg">

            <FiSearch className="absolute left-3 top-3 text-gray-400" />

            <input
              type="text"
              placeholder="Search Candidates or Jobs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 rounded-lg shadow-sm focus:ring-2 focus:ring-gray-400 focus:outline-none"
            />

          </div>

          {/* STATUS FILTER */}
          {/* STATUS FILTER */}
          <div className="flex gap-2 flex-wrap">

            {[
              "Applied",
              "Application Reviewed",
              "Interview Scheduled",
              "On Hold",
              "Offered",
              "Onboarding",
            ].map((item) => (
              <button
                key={item}
                onClick={() =>
                  setStatus(status === item ? "" : item) // ⭐ toggle + reset
                }
                className={`px-4 py-2 rounded-full text-sm transition ${status === item
                  ? "bg-[#0057B8] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
              >
                {item}
              </button>
            ))}

          </div>

        </div>

        {/* RIGHT SECTION */}
        <div className="flex gap-2">

          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm ${view === "kanban"
              ? "bg-[#0057B8] text-white"
              : "bg-white hover:bg-gray-100"
              }`}
          >
            <FiGrid />
          </button>

          <button
            onClick={() => setView("table")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm ${view === "table"
              ? "bg-[#0057B8] text-white"
              : "bg-white hover:bg-gray-100"
              }`}
          >
            <FiList />
          </button>

        </div>

      </div>

    </div>
  );
}