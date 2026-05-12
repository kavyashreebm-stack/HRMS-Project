import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import AE_Logo from "../../../assets/images/AE_Logo.png";
import { getCandidateProfile, updateCandidateProfile } from "../../../api";

import ProfileStepper from "../components/ui/ProfileStepper";
import PersonalDetails from "../components/profile/PersonalDetails";
import EducationDetails from "../components/profile/EducationDetails";
import EmploymentDetails from "../components/profile/EmploymentDetails";
import ReferenceDetails from "../components/profile/ReferencesDetails";
import FamilyDetails from "../components/profile/FamilyDetails";
import MedicalDetails from "../components/profile/MedicalDetails";
import Declaration from "../components/profile/DeclarationDetails";
import Toast from "../components/ui/Toast";
import useToasts from "../hooks/useToasts";

import {
  PersonalIcon,
  EducationIcon,
  EmploymentIcon,
  ReferencesIcon,
  FamilyIcon,
  MedicalIcon,
  DeclarationIcon,
} from "../../../assets/icons/AllIcons";

const SECTIONS = [
  "Personal Details",
  "Education Details",
  "Employment Details",
  "References Details",
  "Family Details",
  "Medical Details",
  "Declaration",
];

const STEP_ICONS = [
  PersonalIcon,
  EducationIcon,
  EmploymentIcon,
  ReferencesIcon,
  FamilyIcon,
  MedicalIcon,
  DeclarationIcon,
];

// 🔹 Get logged-in user
const getLoggedInUser = () => {
  const user = localStorage.getItem("loggedInUser");
  return user ? JSON.parse(user) : null;
};

const DEFAULT_FORM_DATA = {
  name: "",
  designation: "",
  correspondenceAddress: "",
  permanentAddress: "",
  mobilePrimary: "",
  mobileAlternate: "",
  email: "",
  dob: "",
  maritalStatus: "",
  gender: "",
  aadhar: "",
  pan: "",
  passport: "",
  bankAccount: "",
  bankName: "",
  ifsc: "",
  uan: "",
  esic: "",
  languages: [],
  customLanguage: "",
  education: [{ degree: "", institute: "", from: "", to: "", specialization: "" }],
  employment: [{ organization: "", from: "", to: "", designation: "", current: false }],
  emergencyContacts: [
    { name: "", relationship: "", contact: "" },
    { name: "", relationship: "", contact: "" },
  ],
  referenceSource: "",
  referencePerson: { name: "", designation: "", contact: "" },
  family: [
    { relation: "Father", name: "", occupation: "", dob: "" },
    { relation: "Mother", name: "", occupation: "", dob: "" },
  ],
  medical: { bloodGroup: "", hasDisability: "No", disabilityYears: "", hasCondition: "No", conditionYears: "" },
  declaration: { date: "", place: "" },
};

// 🔹 Map Backend to Frontend
const mapBackendToFrontend = (data) => {
  let formattedDob = "";
  if (data.date_of_birth && data.date_of_birth.includes("-")) {
    const parts = data.date_of_birth.split("-");
    if (parts[0].length === 2) {
      formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    } else {
      formattedDob = data.date_of_birth;
    }
  }

  return {
    ...DEFAULT_FORM_DATA,
    ...data,
    name: data.name || "",
    mobilePrimary: data.phone_number || "",
    mobileAlternate: data.mobile2 || "",
    dob: formattedDob,
    correspondenceAddress: data.correspondence_address || "",
    permanentAddress: data.permanent_address || "",
    maritalStatus: data.marital_status || "",
    bankAccount: data.bank_account || "",
    bankName: data.bank_name || "",
    uan: data.uan || "",
    esic: data.esic || "",
    languages: data.languages || [],
    customLanguage: data.custom_language || "",
    emergencyContacts: data.emergency_contacts || DEFAULT_FORM_DATA.emergencyContacts,
    referencePerson: data.reference_person || DEFAULT_FORM_DATA.referencePerson,
    referenceSource: data.reference_source || "",
    is_profile_created: data.is_profile_created || false,
    photo_path: data.photo_path || null,
    resume_path: data.resume_path || null,
    aadhar_doc_path: data.aadhar_doc_path || null,
    pan_doc_path: data.pan_doc_path || null,
    sslc_doc_path: data.sslc_doc_path || null,
  };
};

// 🔹 Map Frontend to Backend
const mapFrontendToBackend = (data) => {
  let formattedDob = data.dob;
  if (data.dob && data.dob.includes("-")) {
    const parts = data.dob.split("-");
    if (parts[0].length === 4) {
      formattedDob = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }

  return {
    name: data.name,
    designation: data.designation,
    phone_number: data.mobilePrimary,
    mobile2: data.mobileAlternate,
    email: data.email,
    date_of_birth: formattedDob,
    marital_status: data.maritalStatus,
    gender: data.gender,
    correspondence_address: data.correspondenceAddress,
    permanent_address: data.permanentAddress,
    aadhar: data.aadhar,
    pan: data.pan,
    passport: data.passport,
    bank_account: data.bankAccount,
    bank_name: data.bankName,
    ifsc: data.ifsc,
    uan: data.uan,
    esic: data.esic,
    languages: data.languages,
    custom_language: data.customLanguage,
    education: data.education,
    employment: data.employment,
    emergency_contacts: data.emergencyContacts,
    reference_person: data.referencePerson,
    reference_source: data.referenceSource,
    family: data.family,
    medical: data.medical,
    declaration: data.declaration,
    is_profile_created: data.is_profile_created || false,
    photo_path: data.photo_path || null,
    resume_path: data.resume_path || null,
    aadhar_doc_path: data.aadhar_doc_path || null,
    pan_doc_path: data.pan_doc_path || null,
    sslc_doc_path: data.sslc_doc_path || null,
  };
};

export default function CandidateProfile({
  readOnly = false,
  isEditFlow = false,
  onSave = () => { },
  onCancel = () => { },
  onEdit = () => { },
  setIsDirty = () => { },
  showHeader = true,
}) {
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToasts();
  const [currentSection, setCurrentSection] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState("Ready");
  const [isDirtyLocal, setIsDirtyLocal] = useState(false);
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreated, setIsCreated] = useState(false);

  const originalDataRef = useRef(formData);
  const user = getLoggedInUser();

  // 🔹 Fetch Data from Backend
  useEffect(() => {
    if (!user || !user.id) {
      setIsLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await getCandidateProfile(user.id);
        if (res.data) {
          const mappedData = mapBackendToFrontend(res.data);
          setFormData(mappedData);
          originalDataRef.current = mappedData;
          setIsCreated(res.data.is_profile_created);
        }
      } catch (err) {
        console.warn("No existing profile found on backend.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [user?.id]);

  const updateFormData = (updater) => {
    setFormData((prev) => {
      const updated = typeof updater === "function" ? updater(prev) : updater;
      return updated;
    });
    if (!readOnly) {
      setIsDirtyLocal(true);
      setIsDirty(true);
    }
  };

  const handleSaveStep = async () => {
    if (!user || !user.id || isSaving) return;
    
    setIsSaving(true);
    setAutoSaveStatus("Saving...");
    try {
      const payload = mapFrontendToBackend(formData);
      await updateCandidateProfile(user.id, payload);
      setAutoSaveStatus("Saved");
      addToast({
        title: "Progress Saved",
        message: `Your ${SECTIONS[currentSection]} have been successfully updated.`,
        type: "success"
      });
      setTimeout(() => setAutoSaveStatus("Ready"), 2000);
      setIsDirtyLocal(false);
      setIsDirty(false);
    } catch (err) {
      console.error("Save step failed:", err);
      setAutoSaveStatus("Error");
      addToast({
        title: "Save Failed",
        message: "Could not save your changes. Please check your connection.",
        type: "warning"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProfile = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      if (user && user.id) {
        const payload = { ...mapFrontendToBackend(formData), is_profile_created: true };
        await updateCandidateProfile(user.id, payload);
        setIsCreated(true);
        addToast({
          title: "Profile Finalized!",
          message: "Your candidate profile is complete. Redirecting to dashboard...",
          type: "success"
        });
        setTimeout(() => navigate("/candidate-dashboard"), 1500);
      }
    } catch (apiErr) {
      console.error("Failed to sync profile to backend:", apiErr);
      addToast({
        title: "Submission Error",
        message: "Failed to finalize your profile. Please try again.",
        type: "warning"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInternalSave = async () => {
    if (isSaving) return;
    await handleSaveStep();
    await onSave(formData);
    originalDataRef.current = formData;
    setIsDirtyLocal(false);
    setIsDirty(false);
  };

  const handleInternalCancel = () => {
    if (isDirtyLocal && !window.confirm("Discard unsaved changes?")) return;
    setFormData(originalDataRef.current);
    setIsDirtyLocal(false);
    setIsDirty(false);
    onCancel();
  };

  const renderSection = () => {
    const props = {
      formData,
      setFormData: updateFormData,
      readOnly,
      setIsDirty,
    };

    switch (currentSection) {
      case 0: return <PersonalDetails {...props} />;
      case 1: return <EducationDetails {...props} />;
      case 2: return <EmploymentDetails {...props} />;
      case 3: return <ReferenceDetails {...props} />;
      case 4: return <FamilyDetails {...props} />;
      case 5: return <MedicalDetails {...props} />;
      case 6: return <Declaration {...props} />;
      default: return null;
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-hidden">
      <Toast toasts={toasts} removeToast={removeToast} />

      {showHeader && (
        <div className="bg-white shadow-sm px-4 md:px-10 py-3 shrink-0">
          <img src={AE_Logo} alt="Logo" className="h-8 md:h-10" />
        </div>
      )}

      <div className="sticky top-0 bg-white z-10 pb-4 shrink-0">
        <ProfileStepper
          sections={SECTIONS}
          currentSection={currentSection}
          setCurrentSection={setCurrentSection}
          autoSave={autoSaveStatus}
          stepIcons={STEP_ICONS}
          readOnly={!isEditFlow}
          isDirty={isDirtyLocal}
        />
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <span className="ml-3 text-gray-600">Loading Profile...</span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 md:p-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 md:p-8 max-w-5xl mx-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">
                  {SECTIONS[currentSection]}
                </h2>

                <div className="flex gap-2">
                  {readOnly && (
                    <button
                      onClick={onEdit}
                      className="px-5 py-1.5 bg-[#0057B8] text-white rounded-full text-sm"
                    >
                      Edit
                    </button>
                  )}

                  {isEditFlow && !readOnly && (
                    <>
                      <button
                        onClick={handleInternalCancel}
                        disabled={isSaving}
                        className="px-4 py-1.5 text-white bg-[#0057B8] border rounded-full text-sm disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        onClick={handleInternalSave}
                        disabled={isSaving}
                        className="px-5 py-1.5 bg-[#0057B8] text-white rounded-full text-sm disabled:opacity-50"
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {renderSection()}
            </motion.div>
          </AnimatePresence>

          {!isEditFlow && !readOnly && (
            <div className="mt-8 flex items-center justify-between max-w-5xl mx-auto pb-12">
              <button
                onClick={() => currentSection > 0 && setCurrentSection(s => s - 1)}
                disabled={currentSection === 0 || isSaving}
                className={`px-6 py-2 rounded-full border ${currentSection === 0 || isSaving ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                Back
              </button>

              {currentSection === SECTIONS.length - 1 ? (
                <>
                  {isCreated ? (
                    <button
                      onClick={() => navigate("/candidate-dashboard")}
                      className="px-6 py-2 bg-red-600 text-white rounded-full"
                    >
                      Go to Dashboard
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateProfile}
                      disabled={isSubmitting}
                      className={`px-6 py-2 text-white rounded-full ${isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-red-600"}`}
                    >
                      {isSubmitting ? "Creating..." : "Create Profile"}
                    </button>
                  )}
                </>
              ) : (
                <button
                  onClick={async () => {
                    await handleSaveStep();
                    setCurrentSection(s => s + 1);
                  }}
                  disabled={isSaving}
                  className={`px-6 py-2 text-white rounded-full ${isSaving ? "bg-gray-400 cursor-not-allowed" : "bg-red-600"}`}
                >
                  {isSaving ? "Saving..." : "Save and Continue"}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}