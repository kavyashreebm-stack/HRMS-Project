import React from "react";
import { Input } from "../ui/FormElements";
import {
  isValidDate,
  calculateExperience,
  parseDate,
} from "../utils/dateHelpers";

export default function EmploymentDetails({
  formData,
  setFormData,
  readOnly,
  setIsDirty,
}) {
  const employmentList = formData?.employment || [];

  const hasOverlap = (index) => {
    const job = employmentList[index];
    if (!job) return false;

    const start = parseDate(job.from);
    const end = job.current ? new Date() : parseDate(job.to);
    if (!start || !end) return false;

    return employmentList.some((other, i) => {
      if (i === index) return false;

      const oStart = parseDate(other.from);
      const oEnd = other.current ? new Date() : parseDate(other.to);
      if (!oStart || !oEnd) return false;

      return start <= oEnd && end >= oStart;
    });
  };

  const updateEmployment = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.employment || [])];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "current" && value === true) {
        updated[index].to = "";
      }

      return { ...prev, employment: updated };
    });

    setIsDirty(true);
  };

  const addEmployment = () => {
    setFormData((prev) => ({
      ...prev,
      employment: [
        ...(prev.employment || []),
        {
          organization: "",
          designation: "",
          from: "",
          to: "",
          current: false,
          summary: "", // ✅ included
        },
      ],
    }));

    setIsDirty(true);
  };

  const removeEmployment = (index) => {
    setFormData((prev) => ({
      ...prev,
      employment: (prev.employment || []).filter((_, i) => i !== index),
    }));

    setIsDirty(true);
  };

  return (
    <div className="space-y-6">
      {employmentList.map((job, index) => (
        <div
          key={index}
          className="p-4 mb-4 relative bg-white rounded-xl shadow-sm"
        >
          {/* REMOVE BUTTON */}
          {!readOnly && employmentList.length > 1 && (
            <button
              onClick={() => removeEmployment(index)}
              className="absolute top-2 right-2 text-white text-sm font-medium bg-[#0057B8] px-2 rounded-full"
            >
              Remove
            </button>
          )}

          {/* MAIN FIELDS */}
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Organization"
              required
              value={job.organization}
              disabled={readOnly}
              onChange={(v) =>
                updateEmployment(index, "organization", v)
              }
            />

            <Input
              label="Designation"
              required
              value={job.designation}
              disabled={readOnly}
              onChange={(v) =>
                updateEmployment(index, "designation", v)
              }
            />

            <Input
              label="From (DD-MM-YYYY)"
              placeholder="DD-MM-YYYY"
              value={job.from}
              disabled={readOnly}
              error={
                job.from && !isValidDate(job.from)
                  ? "Invalid format"
                  : ""
              }
              onChange={(v) => updateEmployment(index, "from", v)}
            />

            <Input
              label="To (DD-MM-YYYY)"
              placeholder="DD-MM-YYYY"
              value={job.to}
              disabled={job.current || readOnly}
              error={
                (!job.current && job.to && !isValidDate(job.to)
                  ? "Invalid format"
                  : "") ||
                (hasOverlap(index) ? "Overlap detected" : "")
              }
              onChange={(v) => updateEmployment(index, "to", v)}
            />
          </div>

          {/* SUMMARY FIELD ✅ FIXED POSITION */}
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">
              Work Summary
            </label>
            <textarea
              rows={3}
              value={job.summary || ""}
              disabled={readOnly}
              onChange={(e) =>
                updateEmployment(index, "summary", e.target.value)
              }
              placeholder="Describe your responsibilities, achievements..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:border-gray-300 focus:ring-0 transition"
            />
          </div>

          {/* FOOTER */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={job.current || false}
                disabled={readOnly}
                onChange={(e) =>
                  updateEmployment(index, "current", e.target.checked)
                }
              />
              Current Job
            </label>

            <span className="text-gray-500 italic">
              Exp:{" "}
              <b>
                {calculateExperience(
                  job.from,
                  job.current ? null : job.to
                )}
              </b>
            </span>
          </div>
        </div>
      ))}

      {/* ADD BUTTON */}
      {!readOnly && (
        <button
          onClick={addEmployment}
          className="text-white text-sm font-medium bg-[#0057B8] px-6 py-2 rounded-full"
        >
          + Add Employment
        </button>
      )}
    </div>
  );
}