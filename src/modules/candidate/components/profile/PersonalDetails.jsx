import React, { useEffect, useState } from "react";
import { Input, Select, Textarea } from "../ui/FormElements";
import { uploadFile, FILE_BASE_URL } from "../../../../api";

// Remove STORAGE_KEY and internal localStorage handling to prevent state conflicts

const languageOptions = [
  "English",
  "Hindi",
  "Kannada",
  "Tamil",
  "Telugu",
  "Malayalam",
  "Not Listed"
];

const PersonalDetails = ({
  formData,
  setFormData,
  readOnly,
  setIsDirty,
}) => {

  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);

  /* UPDATE TEXT FIELDS */

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsDirty?.(true);
  };

  /* MULTI LANGUAGE SELECT */

  const toggleLanguage = (lang) => {
    let updated = formData.languages || [];

    if (updated.includes(lang)) {
      updated = updated.filter((l) => l !== lang);
    } else {
      updated = [...updated, lang];
    }

    updateField("languages", updated);
  };

  /* EMERGENCY CONTACTS */

  const updateEmergency = (index, field, value) => {
    const updatedContacts = [...(formData.emergencyContacts || [])];

    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };

    updateField("emergencyContacts", updatedContacts);
  };

  const addEmergencyContact = () => {
    const updated = [
      ...(formData.emergencyContacts || []),
      { name: "", relationship: "", contact: "" },
    ];

    updateField("emergencyContacts", updated);
  };

  /* PHOTO UPLOAD */

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 1. Upload to backend
      const res = await uploadFile(file, "photos");
      const serverPath = res.data.path;

      // 2. Create local preview
      const reader = new FileReader();
      reader.onload = () => {
        const photoData = {
          name: file.name,
          data: reader.result,
        };

        setFormData((prev) => ({ 
          ...prev, 
          photo: photoData,
          photo_path: serverPath // ✅ STORE SERVER PATH
        }));
        setIsDirty?.(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Photo upload failed:", err);
      alert("Failed to upload photo. Please try again.");
    }
  };

  /* RESUME UPLOAD */

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      // 1. Upload to backend
      const res = await uploadFile(file, "resumes");
      const serverPath = res.data.path;

      // 2. Local State for UI
      const reader = new FileReader();
      reader.onload = () => {
        const resumeData = {
          name: file.name,
          data: reader.result,
        };

        setFormData((prev) => ({ 
          ...prev, 
          resume: resumeData,
          resume_path: serverPath // ✅ STORE SERVER PATH
        }));
        setIsDirty?.(true);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Resume upload failed:", err);
      alert("Failed to upload resume. Please try again.");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow p-6">

      <div className="grid grid-cols-2 gap-4">

        <Input
          label="Name (Capital Letters)"
          required
          value={formData.name || ""}
          onChange={(v) => updateField("name", v.toUpperCase())}
          disabled={readOnly}
        />

        <Input
          label="Designation Applied For"
          value={formData.designation || ""}
          onChange={(v) => updateField("designation", v)}
          disabled={readOnly}
        />

        <Textarea
          label="Correspondence Address"
          value={formData.correspondenceAddress || ""}
          onChange={(v) => updateField("correspondenceAddress", v)}
          disabled={readOnly}
        />

        <Textarea
          label="Permanent Address (as per Aadhar)"
          value={formData.permanentAddress || ""}
          onChange={(v) => updateField("permanentAddress", v)}
          disabled={readOnly}
        />

        <Input
          label="Mobile No (Primary)"
          required
          value={formData.mobilePrimary || ""}
          onChange={(v) => updateField("mobilePrimary", v)}
          disabled={readOnly}
        />

        <Input
          label="Mobile No (Alternate)"
          value={formData.mobileAlternate || ""}
          onChange={(v) => updateField("mobileAlternate", v)}
          disabled={readOnly}
        />

        <Input
          label="Email ID"
          value={formData.email || ""}
          onChange={(v) => updateField("email", v)}
          disabled={readOnly}
        />

        <Input
          label="Date of Birth"
          type="date"
          value={formData.dob || ""}
          onChange={(v) => updateField("dob", v)}
          disabled={readOnly}
        />

        <Select
          label="Marital Status"
          value={formData.maritalStatus || ""}
          onChange={(v) => updateField("maritalStatus", v)}
          disabled={readOnly}
          options={[
            { label: "Select", value: "" },
            { label: "Single", value: "single" },
            { label: "Married", value: "married" },
            { label: "Other", value: "other" },
          ]}
        />

        <Select
          label="Gender"
          value={formData.gender || ""}
          onChange={(v) => updateField("gender", v)}
          disabled={readOnly}
          options={[
            { label: "Select", value: "" },
            { label: "Female", value: "female" },
            { label: "Male", value: "male" },
            { label: "Other", value: "other" },
          ]}
        />

        {/* MULTI LANGUAGE SELECT */}
        <div className="mb-4 relative">
          <label className="block text-sm font-medium mb-1">
            Languages Known
          </label>

          <div
            tabIndex={readOnly ? -1 : 0}
            className={`w-full border border-gray-300 px-2 py-1 rounded flex justify-between items-center transition-all focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none
      ${readOnly ? "bg-white cursor-not-allowed opacity-60" : "bg-white cursor-pointer hover:border-gray-400"}`}
            onClick={() => {
              if (!readOnly) setShowLanguageDropdown(!showLanguageDropdown);
            }}
            onKeyDown={(e) => {
              if (readOnly) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setShowLanguageDropdown(!showLanguageDropdown);
              }
            }}
          >
            <span className={`text-sm ${formData.languages?.length ? "text-black" : "text-gray-400"}`}>
              {formData.languages?.length
                ? formData.languages.join(", ")
                : "Select Languages"}
            </span>
            {!readOnly && <span className="text-xs transition-transform duration-200" style={{ transform: showLanguageDropdown ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>}
          </div>

          {!readOnly && showLanguageDropdown && (
            <div className="absolute w-full mt-1 border rounded shadow-lg bg-white max-h-48 overflow-y-auto z-50">
              {languageOptions.map((lang) => (
                <label
                  key={lang}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-white cursor-pointer text-sm"
                >
                  <input
                    type="checkbox"
                    checked={(formData.languages || []).includes(lang)}
                    onChange={() => toggleLanguage(lang)}
                  />
                  {lang}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Custom language if "Not Listed" */}
        {formData.languages?.includes("Not Listed") && (
          <Input
            label="Specify Language"
            value={formData.customLanguage || ""}
            onChange={(v) => updateField("customLanguage", v)}
            disabled={readOnly}
          />
        )}

        <Input label="Aadhar Card No" value={formData.aadhar || ""} onChange={(v) => updateField("aadhar", v)} disabled={readOnly} />
        <Input label="PAN Card No" value={formData.pan || ""} onChange={(v) => updateField("pan", v)} disabled={readOnly} />
        <Input label="Passport No" value={formData.passport || ""} onChange={(v) => updateField("passport", v)} disabled={readOnly} />
        <Input label="Bank Account No" value={formData.bankAccount || ""} onChange={(v) => updateField("bankAccount", v)} disabled={readOnly} />
        <Input label="Bank Name" value={formData.bankName || ""} onChange={(v) => updateField("bankName", v)} disabled={readOnly} />
        <Input label="IFSC Code" value={formData.ifsc || ""} onChange={(v) => updateField("ifsc", v)} disabled={readOnly} />
        <Input label="UAN No" value={formData.uan || ""} onChange={(v) => updateField("uan", v)} disabled={readOnly} />
        <Input label="ESIC No" value={formData.esic || ""} onChange={(v) => updateField("esic", v)} disabled={readOnly} />

        {/* PHOTO UPLOAD */}

        <div className="col-span-2">

          <label className="block text-sm font-medium mb-1">
            Upload Photo (2MB Max)
          </label>

          <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-500">

            <input
              type="file"
              accept="image/*"
              id="photoUpload"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={readOnly}
            />

            <label htmlFor="photoUpload" className="cursor-pointer">
              Drop photo here or click to upload
            </label>

          </div>

          {(formData.photo || formData.photo_path) && (
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
              <img
                src={formData.photo?.data || (formData.photo_path ? `${FILE_BASE_URL}/${formData.photo_path}` : "")}
                alt="Candidate"
                className="w-10 h-10 rounded-full object-cover border cursor-pointer"
                onClick={() => setShowPhotoPreview(true)}
              />
              {formData.photo?.name || "Profile Photo"}
            </div>
          )}

        </div>

        {/* RESUME UPLOAD */}

        <div className="col-span-2">

          <label className="block text-sm font-medium mb-1">
            Upload Resume (5MB Max)
          </label>

          <div className="border-2 border-dashed rounded-xl p-6 text-center text-gray-500">

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              id="resumeUpload"
              className="hidden"
              onChange={handleResumeUpload}
              disabled={readOnly}
            />

            <label htmlFor="resumeUpload" className="cursor-pointer">
              Drop files here or click to upload
            </label>

          </div>

          {(formData.resume || formData.resume_path) && (
            <p className="text-sm text-gray-600 mt-2">
              📄 {formData.resume?.name || "Candidate Resume"} —
              <a
                href={formData.resume?.data || (formData.resume_path ? `${FILE_BASE_URL}/${formData.resume_path}` : "#")}
                download={formData.resume?.name || "resume.pdf"}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 font-medium ml-1"
              >
                Download / View
              </a>
            </p>
          )}

        </div>

        {/* EMERGENCY CONTACTS */}

        <div className="col-span-2 mt-6">

          <div className="flex justify-between items-center mb-2">

            <h3 className="font-medium">Emergency Contacts</h3>

            {!readOnly && (
              <button
                type="button"
                onClick={addEmergencyContact}
                className="text-sm px-3 py-1 rounded-lg bg-[#0057B8] text-white"
              >
                + Add Contact
              </button>
            )}

          </div>

          {formData?.emergencyContacts?.map((contact, index) => (

            <div key={index} className="grid grid-cols-3 gap-3 mb-3">

              <Input
                label="Name"
                value={contact.name}
                onChange={(v) => updateEmergency(index, "name", v)}
                disabled={readOnly}
              />

              <Input
                label="Relationship"
                value={contact.relationship}
                onChange={(v) => updateEmergency(index, "relationship", v)}
                disabled={readOnly}
              />

              <Input
                label="Contact No"
                value={contact.contact}
                onChange={(v) => updateEmergency(index, "contact", v)}
                disabled={readOnly}
              />

            </div>

          ))}

        </div>

      </div>

      {/* PHOTO PREVIEW MODAL */}

      {showPhotoPreview && formData.photo && (
        <div
          className="fixed inset-0 g-white/70 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowPhotoPreview(false)}
        >

          <div
            className="bg-white p-4 rounded-xl shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >

            <img
              src={formData.photo?.data || (formData.photo_path ? `${FILE_BASE_URL}/${formData.photo_path}` : "")}
              alt="Preview"
              className="w-40 h-48 object-cover border rounded-md"
            />

            <button
              className="mt-3 w-full text-sm bg-gray-800 text-white py-1 rounded"
              onClick={() => setShowPhotoPreview(false)}
            >
              Close
            </button>

          </div>

        </div>

      )}

    </div>
  );
};

export default PersonalDetails;