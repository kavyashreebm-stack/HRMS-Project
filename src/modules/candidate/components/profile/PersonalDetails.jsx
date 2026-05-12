import React, { useState } from "react";
import { Input, Select, Textarea } from "../ui/FormElements";
import { uploadFile, FILE_BASE_URL } from "../../../../api";

const languageOptions = [
  "English", "Hindi", "Kannada", "Tamil", "Telugu", "Malayalam", "Not Listed"
];

const PersonalDetails = ({
  formData,
  setFormData,
  readOnly,
  setIsDirty,
}) => {
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showResumePreview, setShowResumePreview] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  /* ✅ MASKING HELPER (Only masks if readOnly is true) */
  const maskString = (str, visibleChars = 4) => {
    if (!str) return "";
    if (!readOnly) return str;
    const clean = str.toString().replace(/\s/g, "");
    if (clean.length <= visibleChars) return str;
    return "•".repeat(clean.length - visibleChars) + clean.slice(-visibleChars);
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty?.(true);
  };

  const toggleLanguage = (lang) => {
    let updated = formData.languages || [];
    if (updated.includes(lang)) {
      updated = updated.filter((l) => l !== lang);
    } else {
      updated = [...updated, lang];
    }
    updateField("languages", updated);
  };

  const updateEmergency = (index, field, value) => {
    const updatedContacts = [...(formData.emergencyContacts || [])];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    updateField("emergencyContacts", updatedContacts);
  };

  const addEmergencyContact = () => {
    const updated = [...(formData.emergencyContacts || []), { name: "", relationship: "", contact: "" }];
    updateField("emergencyContacts", updated);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadFile(file, "photos");
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ 
          ...prev, 
          photo: { name: file.name, data: reader.result },
          photo_path: res.data.path 
        }));
        setIsDirty?.(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Photo upload failed. Please try again.");
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const res = await uploadFile(file, "resumes");
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ 
          ...prev, 
          resume: { name: file.name, data: reader.result },
          resume_path: res.data.path 
        }));
        setIsDirty?.(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Resume upload failed. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Name" required value={formData.name || ""} onChange={(v) => updateField("name", v.toUpperCase())} disabled={readOnly} />
        <Input label="Designation Applied For" value={formData.designation || ""} onChange={(v) => updateField("designation", v)} disabled={readOnly} />
        <Textarea label="Correspondence Address" value={formData.correspondenceAddress || ""} onChange={(v) => updateField("correspondenceAddress", v)} disabled={readOnly} />
        <Textarea label="Permanent Address" value={formData.permanentAddress || ""} onChange={(v) => updateField("permanentAddress", v)} disabled={readOnly} />
        <Input label="Mobile (Primary)" required value={formData.mobilePrimary || ""} onChange={(v) => updateField("mobilePrimary", v)} disabled={readOnly} />
        <Input label="Mobile (Alternate)" value={formData.mobileAlternate || ""} onChange={(v) => updateField("mobileAlternate", v)} disabled={readOnly} />
        <Input label="Email ID" value={formData.email || ""} onChange={(v) => updateField("email", v)} disabled={readOnly} />
        <Input label="Date of Birth" type="date" value={formData.dob || ""} onChange={(v) => updateField("dob", v)} disabled={readOnly} />
        
        <Select label="Marital Status" value={formData.maritalStatus || ""} onChange={(v) => updateField("maritalStatus", v)} disabled={readOnly} options={[{ label: "Select", value: "" }, { label: "Single", value: "single" }, { label: "Married", value: "married" }, { label: "Other", value: "other" }]} />
        <Select label="Gender" value={formData.gender || ""} onChange={(v) => updateField("gender", v)} disabled={readOnly} options={[{ label: "Select", value: "" }, { label: "Female", value: "female" }, { label: "Male", value: "male" }, { label: "Other", value: "other" }]} />

        {/* LANGUAGES */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1">Languages Known</label>
          <div tabIndex={readOnly ? -1 : 0} className={`w-full border border-gray-300 px-2 py-1 rounded flex justify-between items-center bg-white ${readOnly ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-gray-400"}`} onClick={() => !readOnly && setShowLanguageDropdown(!showLanguageDropdown)}>
            <span className={`text-sm ${formData.languages?.length ? "text-black" : "text-gray-400"}`}>{formData.languages?.length ? formData.languages.join(", ") : "Select Languages"}</span>
            {!readOnly && <span>▼</span>}
          </div>
          {!readOnly && showLanguageDropdown && (
            <div className="absolute w-full mt-1 border rounded shadow-lg bg-white max-h-48 overflow-y-auto z-50">
              {languageOptions.map((lang) => (
                <label key={lang} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={(formData.languages || []).includes(lang)} onChange={() => toggleLanguage(lang)} /> {lang}
                </label>
              ))}
            </div>
          )}
        </div>
        {formData.languages?.includes("Not Listed") && <Input label="Specify Language" value={formData.customLanguage || ""} onChange={(v) => updateField("customLanguage", v)} disabled={readOnly} />}

        {/* ✅ MASKED SENSITIVE FIELDS */}
        <Input label="Aadhar Card No" value={maskString(formData.aadhar) || ""} onChange={(v) => updateField("aadhar", v)} disabled={readOnly} />
        <Input label="PAN Card No" value={maskString(formData.pan) || ""} onChange={(v) => updateField("pan", v)} disabled={readOnly} />
        <Input label="Passport No" value={maskString(formData.passport) || ""} onChange={(v) => updateField("passport", v)} disabled={readOnly} />
        <Input label="Bank Account No" value={maskString(formData.bankAccount) || ""} onChange={(v) => updateField("bankAccount", v)} disabled={readOnly} />
        <Input label="Bank Name" value={formData.bankName || ""} onChange={(v) => updateField("bankName", v)} disabled={readOnly} />
        <Input label="IFSC Code" value={maskString(formData.ifsc) || ""} onChange={(v) => updateField("ifsc", v)} disabled={readOnly} />
        <Input label="UAN No" value={maskString(formData.uan) || ""} onChange={(v) => updateField("uan", v)} disabled={readOnly} />
        <Input label="ESIC No" value={maskString(formData.esic) || ""} onChange={(v) => updateField("esic", v)} disabled={readOnly} />

        {/* PHOTO */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Photo (2MB Max)</label>
          <div className="border-2 border-dashed rounded-xl p-4 text-center text-gray-500">
            <input type="file" accept="image/*" id="photoUpload" className="hidden" onChange={handlePhotoUpload} disabled={readOnly} />
            <label htmlFor="photoUpload" className="cursor-pointer">Click to upload photo</label>
          </div>
          {(formData.photo || formData.photo_path) && (
            <div className="flex items-center gap-2 mt-2">
              <img src={formData.photo?.data || `${FILE_BASE_URL}/${formData.photo_path}`} alt="Candidate" className="w-10 h-10 rounded-full object-cover border cursor-pointer" onClick={() => setShowPhotoPreview(true)} />
              <span className="text-sm">{formData.photo?.name || "Profile Photo"}</span>
            </div>
          )}
        </div>

        {/* RESUME */}
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Resume (5MB Max)</label>
          <div className="border-2 border-dashed rounded-xl p-4 text-center text-gray-500">
            <input type="file" accept=".pdf,.doc,.docx" id="resumeUpload" className="hidden" onChange={handleResumeUpload} disabled={readOnly} />
            <label htmlFor="resumeUpload" className="cursor-pointer">Click to upload resume</label>
          </div>
          {(formData.resume || formData.resume_path) && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm">📄 {formData.resume?.name || "Candidate Resume"}</span>
              <button type="button" onClick={() => setShowResumePreview(true)} className="text-blue-600 font-bold hover:underline text-sm">View CV</button>
            </div>
          )}
        </div>

        {/* EMERGENCY CONTACTS */}
        <div className="col-span-2 mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Emergency Contacts</h3>
            {!readOnly && <button type="button" onClick={addEmergencyContact} className="text-xs px-3 py-1 rounded bg-[#0057B8] text-white">+ Add</button>}
          </div>
          {formData?.emergencyContacts?.map((contact, index) => (
            <div key={index} className="grid grid-cols-3 gap-3 mb-3">
              <Input label="Name" value={contact.name} onChange={(v) => updateEmergency(index, "name", v)} disabled={readOnly} />
              <Input label="Relationship" value={contact.relationship} onChange={(v) => updateEmergency(index, "relationship", v)} disabled={readOnly} />
              <Input label="Contact No" value={contact.contact} onChange={(v) => updateEmergency(index, "contact", v)} disabled={readOnly} />
            </div>
          ))}
        </div>
      </div>

      {/* PHOTO MODAL */}
      {showPhotoPreview && (formData.photo || formData.photo_path) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowPhotoPreview(false)}>
          <div className="bg-white p-4 rounded-2xl shadow-xl" onClick={(e) => e.stopPropagation()}>
            <img src={formData.photo?.data || `${FILE_BASE_URL}/${formData.photo_path}`} alt="Preview" className="max-w-xs max-h-[70vh] object-contain" />
            <button className="mt-4 w-full py-2 bg-gray-900 text-white rounded-xl font-bold" onClick={() => setShowPhotoPreview(false)}>Close</button>
          </div>
        </div>
      )}

      {/* ✅ RESUME MODAL */}
      {showResumePreview && (formData.resume || formData.resume_path) && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4 lg:p-10" onClick={() => setShowResumePreview(false)}>
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold">Resume Preview</h3>
              <button onClick={() => setShowResumePreview(false)}>✕</button>
            </div>
            <div className="flex-1 bg-gray-100">
              <iframe src={formData.resume?.data || `${FILE_BASE_URL}/${formData.resume_path}`} className="w-full h-full border-none" title="Resume" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonalDetails;