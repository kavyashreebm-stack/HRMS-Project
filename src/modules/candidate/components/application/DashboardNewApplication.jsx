import React, { useEffect, useState } from "react";
import NewApplicationForm from "./NewApplicationForm";
import ApplicationViewModal from "./ApplicationViewModal";
import { Eye, Trash2 } from "lucide-react";
import { applyForJob, getCandidateApplications, deleteApplication } from "../../../../api";

export default function DashboardNewApplication({ currentUser, onView }) {
  const [applications, setApplications] = useState([]);
  const [view, setView] = useState("list"); // list | create
  const [formData, setFormData] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [viewApp, setViewApp] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (view === "create" && currentUser?.id) {
      const draft = localStorage.getItem(`application_draft_${currentUser.id}`);
      if (draft) {
        try {
          setFormData(JSON.parse(draft));
          setIsDirty(true);
        } catch (e) {
          console.error("Failed to parse application draft", e);
        }
      }
    }
  }, [view, currentUser?.id]);

  useEffect(() => {
    if (isDirty && currentUser?.id && Object.keys(formData).length > 0) {
      localStorage.setItem(`application_draft_${currentUser.id}`, JSON.stringify(formData));
    }
  }, [formData, isDirty, currentUser?.id]);

  /* ✅ FETCH APPLICATIONS FROM BACKEND */
  const fetchApps = async () => {
    try {
      const response = await getCandidateApplications();
      setApplications(response.data || []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  /* ✅ DELETE APPLICATION */
  const handleDelete = async (appId) => {
    if (!window.confirm("Are you sure you want to remove this application? This action cannot be undone.")) return;
    setDeletingId(appId);
    try {
      await deleteApplication(appId);
      setApplications(prev => prev.filter(a => a.id !== appId));
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete application. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  /* ✅ SUBMIT APPLICATION */
  const handleSubmit = async () => {
    if (isSubmitting) return;

    const storedUser = JSON.parse(localStorage.getItem("loggedInUser"));
    if (!storedUser?.email) {
      alert("Session expired. Please login again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        department: formData.department,
        experience_type: formData.experienceStatus,
        other_details: {
          totalExperience: formData.totalExperience,
          availability: formData.availability,
          source: formData.source,
          referred: formData.referred,
          refName: formData.refName,
          refDept: formData.refDept,
          refMobile: formData.refMobile,
          aeBefore: formData.aeBefore,
          is18: formData.is18
        }
      };

      await applyForJob(payload);
      await fetchApps();
      setFormData({});
      setIsDirty(false);
      localStorage.removeItem(`application_draft_${storedUser.id}`);
      alert("Application submitted successfully!");
      setView("list");
    } catch (err) {
      console.error("Submission failed:", err);
      const errorMsg = err.response?.data?.detail || "An error occurred while submitting. Please try again.";
      alert(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (view === "create") {
    return (
      <NewApplicationForm
        formData={formData}
        setFormData={setFormData}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        onBack={() => setView("list")}
      />
    );
  }

  if (viewApp) {
    return (
      <ApplicationViewModal
        application={viewApp}
        onClose={() => setViewApp(null)}
      />
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">My Applications</h2>
        <button
          onClick={() => setView("create")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition"
        >
          + New Application
        </button>
      </div>

      {applications.length === 0 ? (
        <div className="flex justify-center items-center h-full">
          <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
            <img
              src="https://illustrations.popsy.co/gray/work-from-home.svg"
              alt="No Applications"
              className="w-48 mx-auto mb-6"
            />
            <h3 className="text-xl font-semibold mb-2">No Applications Yet</h3>
            <p className="text-gray-500 mb-6">
              You haven't submitted any job applications. Start your career journey by applying today.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="shadow-sm border border-gray-100 p-4 rounded-lg flex justify-between items-center bg-white"
            >
              <div>
                <p><strong>{app.candidate_profile?.name || "Candidate"}</strong></p>
                <p className="text-sm text-gray-500">{app.department}</p>
                <p className="text-sm text-gray-400">Status: {app.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewApp(app)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0057B8] text-white text-sm font-medium hover:bg-[#0046a3] transition"
                >
                  <Eye size={16} /> View
                </button>
                <button
                  onClick={() => handleDelete(app.id)}
                  disabled={deletingId === app.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-50 text-red-600 border border-red-200 text-sm font-medium hover:bg-red-100 transition disabled:opacity-50"
                  title="Remove application"
                >
                  {deletingId === app.id ? (
                    <span className="text-xs">Removing...</span>
                  ) : (
                    <><Trash2 size={15} /> Remove</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}