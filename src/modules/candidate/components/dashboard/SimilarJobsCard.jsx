import React from "react";

export default function SimilarJobsCard({ jobs = [] }) {

  return (

    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-3xl shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 h-full flex flex-col">

      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <div className="bg-purple-100 p-1 rounded-lg">
            <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          Similar Jobs
        </h3>
      </div>

      {/* Jobs List - Precisely 2 rows visible, scroll on 3rd */}
      <div className="max-h-[140px] overflow-y-auto pr-1 custom-scrollbar flex-1">
        <div className="space-y-2">
          {jobs.length > 0 ? (
            jobs.map((job, i) => (
              <div
                key={i}
                className="group p-3 bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md transition-all duration-300 cursor-pointer"
              >
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                      {job.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {job.department}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] text-gray-400">
                        {job.location}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 p-1 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors">
                    <svg className="w-3 h-3 text-gray-400 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 opacity-40">
              <p className="text-[10px] font-medium text-gray-400">Apply for jobs to see recommendations</p>
            </div>
          )}
        </div>
      </div>

    </div>

  );
}