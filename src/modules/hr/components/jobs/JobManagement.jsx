import React, { useState, useEffect } from "react";
import { Plus, Trash2, Briefcase, MapPin, Building2, Search, X, Loader2 } from "lucide-react";
import { getHRJobs, postJob, deleteJob } from "../../../../api";
import { Input, Select, Textarea } from "../../../candidate/components/ui/FormElements";

export default function JobManagement() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    location: "Bangalore",
    description: "",
  });

  const departments = [
    "CNC", "VMC", "TMC", "Accounts", "Data Analyst", "Dispatch",
    "Purchase", "Sales", "Quality", "Stores", "Software Development", "HR"
  ];

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await getHRJobs();
      setJobs(res.data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!newJob.title || !newJob.department) {
      alert("Please fill in the required fields.");
      return;
    }

    try {
      setIsSubmitting(true);
      await postJob(newJob);
      setIsModalOpen(false);
      setNewJob({ title: "", department: "", location: "Bangalore", description: "" });
      fetchJobs();
    } catch (err) {
      console.error("Failed to post job:", err);
      alert("Error posting job. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job posting?")) return;
    try {
      await deleteJob(jobId);
      fetchJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Job Postings</h1>
          <p className="text-sm text-gray-500">Manage available openings in your company</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#0057B8] text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
        >
          <Plus size={20} />
          <span>Post New Job</span>
        </button>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by title or department..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-100 outline-none text-sm transition"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-400 font-medium whitespace-nowrap">
          {filteredJobs.length} Positions Active
        </div>
      </div>

      {/* JOBS LIST/GRID */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <Loader2 className="animate-spin mb-2" size={32} />
            <p>Loading jobs...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition group relative overflow-hidden"
              >
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-[#0057B8] transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                          <Building2 size={14} className="text-blue-500" />
                          {job.department}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg">
                          <MapPin size={14} className="text-red-400" />
                          {job.location}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
                      {job.description || "No description provided."}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete Posting"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>

                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#0057B8]/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 p-12 text-center">
            <div className="bg-white p-4 rounded-2xl shadow-sm mb-4">
              <Briefcase size={40} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">No Job Postings Found</h3>
            <p className="text-sm text-gray-500 mt-1 max-w-xs">
              {searchQuery ? "No jobs match your search criteria." : "Start by posting your first available job opening."}
            </p>
          </div>
        )}
      </div>

      {/* POST JOB MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b flex items-center justify-between bg-[#0057B8] text-white">
              <h2 className="text-xl font-bold">Post New Job</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="p-6 space-y-1">
              <Input
                label="Job Title"
                placeholder="e.g. Senior CNC Operator"
                required
                value={newJob.title}
                onChange={(v) => setNewJob({ ...newJob, title: v })}
              />

              <Select
                label="Department"
                required
                options={departments}
                value={newJob.department}
                onChange={(v) => setNewJob({ ...newJob, department: v })}
              />

              <Input
                label="Location"
                placeholder="e.g. Bangalore"
                value={newJob.location}
                onChange={(v) => setNewJob({ ...newJob, location: v })}
              />

              <Textarea
                label="Description"
                placeholder="Briefly describe the role and requirements..."
                value={newJob.description}
                onChange={(v) => setNewJob({ ...newJob, description: v })}
                rows={4}
              />

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-2.5 rounded-xl border border-gray-200 font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-[#0057B8] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                  {isSubmitting ? "Posting..." : "Post Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
