import React from 'react';
import { Input, Select } from "../ui/FormElements"; // import Select
import { isValidDate } from '../utils/dateHelpers';

export default function EducationDetails({ formData, setFormData, readOnly, setIsDirty }) {

  const educationList = formData?.education || [];

  const updateEducation = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.education || [])];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
    setIsDirty(true);
  };

  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        { degree: "", institute: "", from: "", to: "", specialization: "", backlog: "No" }
      ]
    }));
  };

  const removeEducation = (index) => {
    setFormData((prev) => ({
      ...prev,
      education: (prev.education || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      {educationList.map((edu, index) => (
        <div key={index} className="p-4 mb-4 relative bg-white rounded-xl shadow-sm">
          <div className="grid grid-cols-2 gap-4">

            <Input
              label="Degree"
              required
              value={edu.degree}
              disabled={readOnly}
              onChange={(v) => updateEducation(index, "degree", v)}
            />

            <Input
              label="University / Institute"
              required
              value={edu.institute}
              disabled={readOnly}
              onChange={(v) => updateEducation(index, "institute", v)}
            />

            <Input
              label="From (DD-MM-YYYY)"
              placeholder="DD-MM-YYYY"
              required
              value={edu.from}
              disabled={readOnly}
              error={edu.from && !isValidDate(edu.from) ? "Invalid date format" : ""}
              onChange={(v) => updateEducation(index, "from", v)}
            />

            <Input
              label="To (DD-MM-YYYY)"
              placeholder="DD-MM-YYYY"
              required
              value={edu.to}
              disabled={readOnly}
              error={edu.to && !isValidDate(edu.to) ? "Invalid date format" : ""}
              onChange={(v) => updateEducation(index, "to", v)}
            />

            <Input
              label="Specialization"
              required
              value={edu.specialization}
              disabled={readOnly}
              onChange={(v) => updateEducation(index, "specialization", v)}
            />

            {/* New Backlog Dropdown */}
            <Select
              label="Any Backlogs?"
              value={edu.backlog || "No"}
              disabled={readOnly}
              onChange={(v) => updateEducation(index, "backlog", v)}
              options={[
                { label: "No", value: "No" },
                { label: "Yes", value: "Yes" },
              ]}
            />
          </div>

          {!readOnly && educationList.length > 1 && (
            <button
              onClick={() => removeEducation(index)}
              className="absolute top-2 right-2 text-white text-sm font-medium bg-[#0057B8] px-2 rounded-full"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      {!readOnly && (
        <button
          onClick={addEducation}
          className="text-white text-sm font-medium bg-[#0057B8] px-6 py-2 rounded-full"
        >
          + Add Education
        </button>
      )}
    </>
  );
}