import React from "react";
import { Input } from "../ui/FormElements";

export default function FamilyDetails({
  formData = {},
  setFormData,
  readOnly = false,
  setIsDirty = () => { },
}) {
  // ✅ Default rows (including spouse)
  const defaultFamily = [
    { relation: "Father", name: "", occupation: "", dob: "", adhaarcard_no: "" },
    { relation: "Mother", name: "", occupation: "", dob: "", adhaarcard_no: "" },
    { relation: "Spouse", name: "", occupation: "", dob: "", adhaarcard_no: "" },
  ];

  // ✅ Merge safely
  const familyList = defaultFamily.map((defaultMember) => {
    const existing = formData?.family?.find(
      (m) => m.relation === defaultMember.relation
    );
    return existing || defaultMember;
  });

  // ✅ Format Aadhaar → 1234 5678 9012
  const formatAadhaar = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();
  };

  // ✅ Validate (remove spaces before checking)
  const isValidAadhaar = (value) =>
    value.replace(/\s/g, "").length === 12;

  const handleAadhaarChange = (index, value) => {
    const formatted = formatAadhaar(value);
    updateFamily(index, "adhaarcard_no", formatted);
  };

  const updateFamily = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...familyList];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, family: updated };
    });
    setIsDirty(true);
  };

  return (
    <div className="space-y-4 rounded-xl shadow-sm p-4">
      {familyList.map((member, index) => (
        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 pb-5"
        >
          <Input label="Relation" value={member.relation} disabled />

          <Input
            label="Name"
            required
            value={member.name || ""}
            disabled={readOnly}
            onChange={(v) => updateFamily(index, "name", v)}
          />

          <Input
            label="Occupation"
            required
            value={member.occupation || ""}
            disabled={readOnly}
            onChange={(v) => updateFamily(index, "occupation", v)}
          />

          <Input
            label="Date of Birth"
            type="date"
            required
            value={member.dob || ""}
            disabled={readOnly}
            onChange={(v) => updateFamily(index, "dob", v)}
          />

          {/* ✅ Aadhaar with spacing format */}
          <Input
            label="Aadhaar Number"
            type="text"
            inputMode="numeric"
            required
            value={member.adhaarcard_no || ""}
            disabled={readOnly}
            placeholder="1234 5678 9012"
            error={
              member.adhaarcard_no &&
                !isValidAadhaar(member.adhaarcard_no)
                ? "Enter valid 12-digit Aadhaar"
                : ""
            }
            onChange={(v) => handleAadhaarChange(index, v)}
          />
        </div>
      ))}
    </div>
  );
}