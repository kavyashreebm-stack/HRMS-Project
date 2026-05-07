import React, { useState, useEffect } from "react";
import { Input, Select, Textarea } from "../ui/FormElements";
import { Eye, FileText, Download, X, Plus, Trash2, ShieldCheck, Info, User } from "lucide-react";
import { compressImage } from "../../../../shared/utils/imageUtils";
import { formatMMYYYY } from "../utils/dateHelpers";
import { getCandidateOptions, getCandidateProfile, uploadFile, FILE_BASE_URL } from "../../../../api";

const yesNoOptions = [
  { label: "Select", value: "" },
  { label: "Yes", value: "yes" },
  { label: "No", value: "no" },
];

const experienceStatusOptions = [
  { label: "Fresher", value: "fresher" },
  { label: "Experienced", value: "experienced" },
];

const maritalStatusOptions = [
  { label: "Select", value: "" },
  { label: "Single", value: "single" },
  { label: "Married", value: "married" },
  { label: "Other", value: "other" },
];

export default function NewApplicationForm({
  formData,
  setFormData,
  readOnly,
  setIsDirty,
  isDirty,
  onSubmit,
  onBack,
}) {
  const [departments, setDepartments] = useState([{ label: "Select", value: "" }]);
  const [sources, setSources] = useState([{ label: "Select", value: "" }]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);

  /* ✅ DATA FETCHING & AUTO-FILL logic preserved from previous state-of-the-art implementation */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = JSON.parse(localStorage.getItem("loggedInUser"));
        const [optRes, profileRes] = await Promise.all([
          getCandidateOptions(),
          storedUser?.id ? getCandidateProfile(storedUser.id) : Promise.resolve({ data: null })
        ]);
        
        setDepartments([{ label: "Select", value: "" }, ...optRes.data.departments]);
        setSources([{ label: "Select", value: "" }, ...optRes.data.sources]);

        // 🧠 INTELLIGENT AUTO-FILL FROM PROFILE (Merging with user's preferred field names)
        if (profileRes.data && !formData.name) {
          const p = profileRes.data;
          
          setFormData(prev => ({
            ...prev,
            // Demographic mapping
            name: p.name || prev.name || "",
            email: p.email || prev.email || "",
            mobile: p.phone_number || prev.mobile || "",
            dob: (p.date_of_birth?.includes("-") && p.date_of_birth.split("-")[0].length === 2) 
                 ? `${p.date_of_birth.split("-")[2]}-${p.date_of_birth.split("-")[1]}-${p.date_of_birth.split("-")[0]}` 
                 : p.date_of_birth || prev.dob || "",
            maritalStatus: p.marital_status || prev.maritalStatus || "",
            gender: p.gender || prev.gender || "",
            currentAddress: p.correspondence_address || prev.currentAddress || "",
            permanentAddress: p.permanent_address || prev.permanentAddress || "",
            
            // Collections mapping
            education: p.education?.length ? p.education.map(e => ({
                degree: e.degree || "",
                institute: e.institute || "",
                yearPassing: e.to || "", 
                specialization: e.specialization || ""
            })) : [{ degree: "", institute: "", yearPassing: "", specialization: "" }],
            
            technicalQualifications: p.technical_qualifications?.length ? p.technical_qualifications : [{ course: "", institute: "", yearPassing: "" }],
            
            employmentHistory: p.employment?.length ? p.employment.map(e => ({
                companyName: e.organization || "",
                designation: e.designation || "",
                durationFrom: e.from || "",
                durationTo: e.to || ""
            })) : [{ companyName: "", designation: "", durationFrom: "", durationTo: "" }],

            // App Specific / Profile Items
            source: p.reference_source || prev.source || "",
            photo: p.photo_path ? { name: "Profile Photo", url: `${FILE_BASE_URL}/${p.photo_path}`, is_profile: true } : prev.photo,
            resume: p.resume_path ? { name: "Candidate Resume", url: `${FILE_BASE_URL}/${p.resume_path}`, is_profile: true } : prev.resume,
            
            // Add internal paths for backend logic
            photo_path: p.photo_path,
            resume_path: p.resume_path
          }));
        }
      } catch (err) {
        console.error("Failed to fetch profile for auto-fill", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const validateForm = () => {
    const fieldLabels = {
      name: "Name",
      department: "Department Applied For",
      currentAddress: "Current Address",
      permanentAddress: "Permanent Address",
      mobile: "Mobile No",
      email: "Email ID",
      dob: "Date of Birth",
      maritalStatus: "Marital Status",
      totalExperience: "Total Work Experience",
      availability: "Availability to Start",
    };

    const requiredFields = Object.keys(fieldLabels);
    for (let field of requiredFields) {
      // Experience is only required if status is "experienced"
      if (field === "totalExperience" && formData.experienceStatus === "fresher") continue;
      
      if (!formData[field]) {
        alert(`Please fill the required field: ${fieldLabels[field]}`);
        return false;
      }
    }

    if (!formData.photo && !formData.photo_path) {
      alert("Please upload your photo");
      return false;
    }

    if (!formData.resume && !formData.resume_path) {
      alert("Please upload your resume");
      return false;
    }

    if (formData.referred === "yes") {
      if (!formData.refName || !formData.refDept || !formData.refMobile) {
        alert("Please fill all referral details");
        return false;
      }
    }

    return true;
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  /* List Handlers using User's UI constraints */

  const handleAddEducation = () => {
    const current = formData.education || [];
    if (current.length >= 2) return;
    updateField("education", [...current, { degree: "", institute: "", yearPassing: "", specialization: "" }]);
  };

  const handleRemoveEducation = (index) => {
    const current = formData.education || [];
    updateField("education", current.filter((_, i) => i !== index));
  };

  const handleAddTechnical = () => {
    const current = formData.technicalQualifications || [];
    if (current.length >= 2) return;
    updateField("technicalQualifications", [...current, { course: "", institute: "", yearPassing: "" }]);
  };

  const handleRemoveTechnical = (index) => {
    const current = formData.technicalQualifications || [];
    updateField("technicalQualifications", current.filter((_, i) => i !== index));
  };

  const handleAddEmployment = () => {
    const current = formData.employmentHistory || [];
    if (current.length >= 2) return;
    updateField("employmentHistory", [...current, { companyName: "", designation: "", durationFrom: "", durationTo: "" }]);
  };

  const handleRemoveEmployment = (index) => {
    const current = formData.employmentHistory || [];
    updateField("employmentHistory", current.filter((_, i) => i !== index));
  };

  /* File Handling - Merging User's Compression with Server Upload */

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Photo must be under 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result, 600, 800, 0.7);
        // Step 1: Upload to server
        const res = await uploadFile(file, "photos");
        updateField("photo", { name: file.name, url: compressed });
        updateField("photo_path", res.data.path);
      } catch (err) {
        console.error("Upload failed", err);
        alert("Upload failed. Please try again.");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Resume must be under 5MB");
      return;
    }

    try {
       const res = await uploadFile(file, "resumes");
       const fileURL = URL.createObjectURL(file);
       updateField("resume", { name: file.name, url: fileURL });
       updateField("resume_path", res.data.path);
    } catch (err) {
       alert("Upload failed. Please try again.");
    }
  };

  const handleBackToList = () => {
    if (isDirty) {
      const confirmLeave = window.confirm("You have unsaved changes. Leave anyway?");
      if (!confirmLeave) return;
    }
    setIsDirty(false);
    onBack();
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="bg-white rounded-2xl shadow h-full flex flex-col border border-gray-100">
      
      {/* HEADER */}
      <div className="p-6 border-b flex justify-between items-center bg-white z-10 shadow-sm rounded-t-2xl">
        <h2 className="text-xl font-bold text-gray-800">
          Job Application Form
        </h2>
        <div className="flex gap-3">
          <button onClick={handleBackToList} className="bg-gray-100 text-gray-600 px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition">
            ← Back
          </button>
          {!readOnly && (
            <button
              onClick={() => validateForm() && onSubmit()}
              className="bg-[#0057B8] text-white px-8 py-2 rounded-full font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition"
            >
              Submit Application
            </button>
          )}
        </div>
      </div>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto p-8 pb-32 space-y-12">
        
        {/* Profile Sync Banner (Logic-driven UI addition) */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-4 items-center animate-in fade-in slide-in-from-top-2 duration-500">
           <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md"><ShieldCheck size={20} /></div>
           <p className="text-sm font-medium text-blue-800">
              Your profile data has been automatically synchronized. Please review the details below.
           </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Section: Personal Details */}
          <div className="col-span-2 flex items-center gap-3">
             <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Personal Information</h3>
          </div>

          <Input label="Name" required value={formData.name || ""} onChange={(v) => updateField("name", v)} disabled={readOnly} />
          <Select label="Department Applied For" required value={formData.department || ""} onChange={(v) => updateField("department", v)} disabled={readOnly} options={departments} />
          <Textarea label="Current Address" required rows={2} value={formData.currentAddress || ""} onChange={(v) => updateField("currentAddress", v)} disabled={readOnly} />
          <Textarea label="Permanent Address" required rows={2} value={formData.permanentAddress || ""} onChange={(v) => updateField("permanentAddress", v)} disabled={readOnly} />
          <Input label="Mobile No" required value={formData.mobile || ""} onChange={(v) => updateField("mobile", v)} disabled={readOnly} />
          <Input label="Date of Birth" type="date" required value={formData.dob || ""} onChange={(v) => updateField("dob", v)} disabled={readOnly} />
          <Input label="Email ID" required value={formData.email || ""} onChange={(v) => updateField("email", v)} disabled={readOnly} />
          <Select label="Marital Status" required value={formData.maritalStatus || ""} onChange={(v) => updateField("maritalStatus", v)} disabled={readOnly} options={maritalStatusOptions} />

          <div className="col-span-2 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
            <label className="block text-sm font-bold text-gray-700 mb-4">Are you a Fresher or Experienced? *</label>
            <div className="flex gap-8">
              {experienceStatusOptions.map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="experienceStatus"
                    value={opt.value}
                    checked={formData.experienceStatus === opt.value}
                    onChange={(e) => {
                        updateField("experienceStatus", e.target.value);
                        if (e.target.value === "fresher") updateField("totalExperience", "0");
                    }}
                    disabled={readOnly}
                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 focus:ring-blue-500"
                  />
                  <span className={`text-sm font-bold transition ${formData.experienceStatus === opt.value ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section: Educational Details */}
          <div className="col-span-2 mt-4 flex items-center justify-between border-t pt-8">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Educational History</h3>
            {!readOnly && (formData.education?.length || 0) < 2 && (
              <button
                onClick={handleAddEducation}
                className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-100 transition flex items-center gap-2"
              >
                <Plus size={16} /> Add More
              </button>
            )}
          </div>

          <div className="col-span-2 space-y-4">
            {(formData.education || [{ degree: "", institute: "", yearPassing: "", specialization: "" }]).map((edu, idx) => (
              <div key={`edu-${idx}`} className="p-8 relative bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-blue-100 transition-all">
                {!readOnly && (formData.education?.length || 0) > 1 && (
                    <button onClick={() => handleRemoveEducation(idx)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input label="Degree" placeholder="e.g. B.Tech Mechanical" value={edu.degree || ""} onChange={(v) => {
                      const newEdu = [...(formData.education || [])];
                      newEdu[idx] = { ...newEdu[idx], degree: v };
                      updateField("education", newEdu);
                  }} disabled={readOnly} />
                  <Input label="University / Institute" placeholder="e.g. MIT University" value={edu.institute || ""} onChange={(v) => {
                      const newEdu = [...(formData.education || [])];
                      newEdu[idx] = { ...newEdu[idx], institute: v };
                      updateField("education", newEdu);
                  }} disabled={readOnly} />
                  <Input label="Year of Passing (MM-YYYY)" placeholder="MM-YYYY" value={edu.yearPassing || ""} onChange={(v) => {
                      const newEdu = [...(formData.education || [])];
                      newEdu[idx] = { ...newEdu[idx], yearPassing: formatMMYYYY(v) };
                      updateField("education", newEdu);
                  }} disabled={readOnly} />
                  <Input label="Specialization" placeholder="e.g. Mechanical / Civil / IT" value={edu.specialization || ""} onChange={(v) => {
                      const newEdu = [...(formData.education || [])];
                      newEdu[idx] = { ...newEdu[idx], specialization: v };
                      updateField("education", newEdu);
                  }} disabled={readOnly} />
                </div>
              </div>
            ))}
          </div>

          {/* Section: Technical Qualifications */}
          <div className="col-span-2 mt-4 flex items-center justify-between border-t pt-8">
            <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Technical Certifications</h3>
            {!readOnly && (formData.technicalQualifications?.length || 0) < 2 && (
              <button onClick={handleAddTechnical} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-100 transition flex items-center gap-2">
                <Plus size={16} /> Add More
              </button>
            )}
          </div>

          <div className="col-span-2 space-y-4">
            {(formData.technicalQualifications || [{ course: "", institute: "", yearPassing: "" }]).map((tech, idx) => (
              <div key={`tech-${idx}`} className="p-8 relative bg-white rounded-3xl shadow-sm border border-gray-100 hover:border-blue-100 transition-all">
                {!readOnly && (formData.technicalQualifications?.length || 0) > 1 && (
                    <button onClick={() => handleRemoveTechnical(idx)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Course / Specialisation" placeholder="e.g. CNC Programming" value={tech.course || ""} onChange={(v) => {
                      const newTech = [...(formData.technicalQualifications || [])];
                      newTech[idx] = { ...newTech[idx], course: v };
                      updateField("technicalQualifications", newTech);
                  }} disabled={readOnly} />
                  <Input label="Institute" placeholder="e.g. GTTC" value={tech.institute || ""} onChange={(v) => {
                      const newTech = [...(formData.technicalQualifications || [])];
                      newTech[idx] = { ...newTech[idx], institute: v };
                      updateField("technicalQualifications", newTech);
                  }} disabled={readOnly} />
                  <Input label="Completion Date (MM-YYYY)" placeholder="MM-YYYY" value={tech.yearPassing || ""} onChange={(v) => {
                      const newTech = [...(formData.technicalQualifications || [])];
                      newTech[idx] = { ...newTech[idx], yearPassing: formatMMYYYY(v) };
                      updateField("technicalQualifications", newTech);
                  }} disabled={readOnly} />
                </div>
              </div>
            ))}
          </div>

          {/* Section: Employment History */}
          {formData.experienceStatus === "experienced" && (
            <div className="col-span-2 mt-4 space-y-6">
              <div className="flex items-center justify-between border-t pt-8">
                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Prev Employment Record</h3>
                {!readOnly && (formData.employmentHistory?.length || 0) < 2 && (
                  <button onClick={handleAddEmployment} className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-sm font-bold hover:bg-blue-100 transition flex items-center gap-2">
                    <Plus size={16} /> Add More
                  </button>
                )}
              </div>

              {(formData.employmentHistory || [{ companyName: "", designation: "", durationFrom: "", durationTo: "" }]).map((emp, idx) => (
                <div key={`emp-${idx}`} className="bg-white rounded-3xl shadow-sm p-8 relative border border-gray-100 hover:border-blue-100 transition-all">
                  {!readOnly && (formData.employmentHistory?.length || 0) > 1 && (
                      <button onClick={() => handleRemoveEmployment(idx)} className="absolute top-6 right-6 text-red-400 hover:text-red-600 transition"><Trash2 size={18} /></button>
                  )}
                  <h4 className="text-blue-600 font-black mb-6 flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-xs">{idx + 1}</span>
                    {idx === 0 ? "Most Recent Employment" : "Previous Experience"}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input label="Company Name" value={emp.companyName || ""} onChange={(v) => {
                        const newEmp = [...(formData.employmentHistory || [])];
                        newEmp[idx] = { ...newEmp[idx], companyName: v };
                        updateField("employmentHistory", newEmp);
                    }} disabled={readOnly} />
                    <Input label="Designation" value={emp.designation || ""} onChange={(v) => {
                        const newEmp = [...(formData.employmentHistory || [])];
                        newEmp[idx] = { ...newEmp[idx], designation: v };
                        updateField("employmentHistory", newEmp);
                    }} disabled={readOnly} />
                    <Input label="Duration From (MM-YYYY)" placeholder="MM-YYYY" value={emp.durationFrom || ""} onChange={(v) => {
                        const newEmp = [...(formData.employmentHistory || [])];
                        newEmp[idx] = { ...newEmp[idx], durationFrom: formatMMYYYY(v) };
                        updateField("employmentHistory", newEmp);
                    }} disabled={readOnly} />
                    <Input label="Duration To (MM-YYYY)" placeholder="MM-YYYY" value={emp.durationTo || ""} onChange={(v) => {
                        const newEmp = [...(formData.employmentHistory || [])];
                        newEmp[idx] = { ...newEmp[idx], durationTo: formatMMYYYY(v) };
                        updateField("employmentHistory", newEmp);
                    }} disabled={readOnly} />
                  </div>
                </div>
              ))}
              <Input label="Total Work Experience (e.g. 5 Years)" required value={formData.totalExperience || ""} onChange={(v) => updateField("totalExperience", v)} disabled={readOnly} />
            </div>
          )}

          {/* Section: Other Details */}
          <div className="col-span-2 mt-4 flex items-center gap-3 border-t pt-8">
             <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Application Specifics</h3>
          </div>

          <Select label="How did you hear about us?" required value={formData.source || ""} onChange={(v) => updateField("source", v)} disabled={readOnly} options={sources} />
          <Select label="Referred by Current Employee?" required value={formData.referred || ""} onChange={(v) => updateField("referred", v)} disabled={readOnly} options={yesNoOptions} />

          {formData.referred === "yes" && (
            <div className="col-span-2 bg-blue-50/30 p-8 rounded-[40px] border-2 border-blue-100 border-dashed animate-in slide-in-from-right-4 duration-500">
               <h4 className="font-black text-blue-700 mb-6 flex items-center gap-2"><Info size={20} /> Referral Details</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input label="Employee Name" required value={formData.refName || ""} onChange={(v) => updateField("refName", v)} disabled={readOnly} />
                  <Input label="Employee Department" required value={formData.refDept || ""} onChange={(v) => updateField("refDept", v)} disabled={readOnly} />
                  <Input label="Employee Mobile No" required value={formData.refMobile || ""} onChange={(v) => updateField("refMobile", v)} disabled={readOnly} />
               </div>
            </div>
          )}

          <Select label="Have you worked at AE before?" required value={formData.aeBefore || ""} onChange={(v) => updateField("aeBefore", v)} disabled={readOnly} options={yesNoOptions} />
          <Select label="Are you at least 18?" required value={formData.is18 || ""} onChange={(v) => updateField("is18", v)} disabled={readOnly} options={yesNoOptions} />
          <Input label="Availability to Start" type="date" required value={formData.availability || ""} onChange={(v) => updateField("availability", v)} disabled={readOnly} />

          {/* Section: Documents */}
          <div className="col-span-2 mt-4 flex items-center gap-3 border-t pt-8">
             <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
             <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Documents & Media</h3>
          </div>

          {/* Photo Upload Smart Container */}
          <div className="col-span-2 lg:col-span-1">
            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Display Photograph (2MB Max)</label>
            
            {!(formData.photo || formData.photo_path) ? (
              <label
                htmlFor="photoUpload"
                className="block border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-400 hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer relative overflow-hidden group h-64 flex flex-col items-center justify-center"
              >
                <input type="file" accept="image/*" id="photoUpload" className="hidden" onChange={handlePhotoUpload} disabled={readOnly} />
                <div className="flex flex-col items-center gap-3">
                   <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 group-hover:text-blue-500 transition"><User size={32} /></div>
                   <p className="font-bold">Drop photo or click to browse</p>
                </div>
              </label>
            ) : (
              <div className="bg-blue-50/30 border-2 border-blue-100 rounded-[32px] p-8 flex flex-col items-center text-center animate-in zoom-in-95 h-64 justify-center">
                <div className="relative group mb-4">
                  <img
                    src={formData.photo?.url || `${FILE_BASE_URL}/${formData.photo_path}`}
                    alt="Candidate"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-blue-50"
                  />
                  {!readOnly && (
                    <label htmlFor="photoUpload" className="absolute -bottom-1 -right-1 bg-white p-2 rounded-full shadow-lg border border-gray-100 text-blue-600 cursor-pointer hover:bg-blue-50 transition transform hover:scale-110">
                      <Plus size={16} />
                      <input type="file" accept="image/*" id="photoUpload" className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-black text-gray-900">{formData.photo?.name || "Profile Photo"}</p>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Document Synchronized</p>
                </div>
                <div className="flex gap-2 mt-4">
                   <button type="button" onClick={() => setShowPhotoPreview(true)} className="px-4 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-xl shadow-sm border border-gray-100 hover:bg-gray-50 transition">Preview</button>
                   {!readOnly && <label htmlFor="photoUpload" className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 transition cursor-pointer">Change</label>}
                </div>
              </div>
            )}
          </div>

          {/* Resume Upload Smart Container */}
          <div className="col-span-2 lg:col-span-1">
            <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Curriculum Vitae (5MB Max)</label>
            
            {!(formData.resume || formData.resume_path) ? (
              <label
                htmlFor="resumeUpload"
                className="block border-2 border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-400 hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer group h-64 flex flex-col items-center justify-center"
              >
                <input type="file" id="resumeUpload" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} disabled={readOnly} />
                <div className="flex flex-col items-center gap-3">
                   <div className="bg-gray-50 p-4 rounded-2xl text-gray-400 group-hover:text-blue-500 transition"><FileText size={32} /></div>
                   <p className="font-bold">Drop resume or click to browse</p>
                </div>
              </label>
            ) : (
              <div className="bg-green-50/30 border-2 border-green-100 rounded-[32px] p-8 flex flex-col items-center text-center animate-in zoom-in-95 h-64 justify-center">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-green-100 flex items-center justify-center text-green-600 mb-4 animate-bounce duration-1000">
                  <FileText size={32} />
                </div>
                <div className="space-y-1 mb-4">
                  <p className="text-sm font-black text-gray-900 truncate max-w-[200px]">{formData.resume?.name || "Professional CV"}</p>
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest leading-none">CV Uploaded Successfully</p>
                </div>
                <div className="flex gap-2">
                   <button type="button" onClick={() => setShowResumePreview(true)} className="p-2.5 text-blue-600 bg-white rounded-xl shadow-sm border border-gray-50 hover:bg-blue-50 transition"><Eye size={18} /></button>
                   <a href={formData.resume?.url || `${FILE_BASE_URL}/${formData.resume_path}`} download className="p-2.5 text-green-600 bg-white rounded-xl shadow-sm border border-gray-50 hover:bg-green-50 transition"><Download size={18} /></a>
                   {!readOnly && (
                      <label htmlFor="resumeUpload" className="px-4 py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl shadow-lg hover:bg-black transition cursor-pointer flex items-center gap-2">
                        <Plus size={14} /> Replace
                      </label>
                   )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS (Ported from User's Snippet) */}
      {showPhotoPreview && (formData.photo || formData.photo_path) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoPreview(false)}>
          <div className="bg-white p-6 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
            <img src={formData.photo?.url || `${FILE_BASE_URL}/${formData.photo_path}`} alt="Preview" className="w-64 h-80 object-cover border-4 border-white rounded-3xl shadow-xl" />
            <button className="mt-6 w-full py-3 bg-gray-900 text-white rounded-2xl font-bold shadow-lg" onClick={() => setShowPhotoPreview(false)}>Close Preview</button>
          </div>
        </div>
      )}

      {showResumePreview && (formData.resume || formData.resume_path) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 lg:p-10" onClick={() => setShowResumePreview(false)}>
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[40px] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-8 duration-500" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black text-gray-800 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl text-white"><FileText size={18} /></div>
                RESUME PREVIEW: {formData.resume?.name || "Document"}
              </h3>
              <button onClick={() => setShowResumePreview(false)} className="p-3 hover:bg-gray-200 rounded-full transition bg-white shadow-sm border border-gray-100"><X size={20} /></button>
            </div>
            <div className="flex-1 bg-gray-100 relative">
              { (formData.resume?.name?.toLowerCase().endsWith(".pdf") || formData.resume_path?.toLowerCase().endsWith(".pdf")) ? (
                <iframe src={formData.resume?.url || `${FILE_BASE_URL}/${formData.resume_path}`} className="w-full h-full border-none shadow-inner" title="Resume Preview" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-20">
                  <div className="bg-white p-10 rounded-[60px] shadow-xl text-center flex flex-col items-center">
                    <FileText size={80} className="text-gray-200 mb-6" />
                    <p className="text-2xl font-black text-gray-900 mb-4">No Preview Available</p>
                    <p className="text-gray-500 mb-8 max-w-sm">This file type cannot be previewed directly. Please download the document to view it on your device.</p>
                    <a href={formData.resume?.url || `${FILE_BASE_URL}/${formData.resume_path}`} download className="bg-blue-600 text-white px-10 py-4 rounded-3xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition flex items-center gap-3"><Download size={20} /> Download Document</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
