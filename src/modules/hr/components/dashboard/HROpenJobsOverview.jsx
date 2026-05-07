import React, { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";
import { getHRJobsOverview } from "../../../../api";

export default function HROpenJobsOverview() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await getHRJobsOverview();
        // Map backend structure to frontend structure
        const mappedJobs = response.data.map(item => ({
          title: item.department.charAt(0).toUpperCase() + item.department.slice(1).replace("_", " "),
          dept: item.department.toUpperCase(),
          count: item.applicant_count
        }));
        setJobs(mappedJobs);
      } catch (err) {
        console.error("Failed to fetch jobs overview:", err);
      }
    };
    fetchJobs();
  }, []);

  return (
    <>
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 shadow-xl border border-white/40 h-full flex flex-col">

        <h2 className="text-xl font-semibold mb-6 text-gray-800 flex items-center gap-2">
          <Briefcase size={20} />
          Open Jobs Overview
        </h2>

        <div className="flex-1 max-h-[300px] overflow-y-auto pr-2 custom-scroll snap-y snap-mandatory space-y-6">
          {jobs.map((job, index) => (
            <div
              key={index}
              className="snap-start flex justify-between items-center p-5 rounded-2xl shadow-sm hover:shadow-lg hover:scale-[1.02] transition-all duration-300 bg-white min-h-[90px]"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-100 p-2 rounded-xl">
                  <Briefcase size={18} className="text-indigo-500" />
                </div>

                <div>
                  <p className="font-semibold text-gray-800">{job.title}</p>
                  <p className="text-sm text-gray-500">{job.dept}</p>
                </div>
              </div>

              <span className="px-4 py-1 text-xs rounded-full font-semibold bg-indigo-100 text-indigo-600">
                {job.count} Applicants
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}