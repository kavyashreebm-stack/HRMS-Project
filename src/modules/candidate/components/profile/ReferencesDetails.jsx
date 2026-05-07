import React from 'react';
import { Input, Select } from '../ui/FormElements';

export default function ReferenceDetails({
  formData = {},
  setFormData,
  readOnly = false,
  setIsDirty = () => {}
}) {

  const referencePerson = formData?.referencePerson || {
    name: "",
    designation: "",
    contact: ""
  };

  const updateRefPerson = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      referencePerson: {
        ...(prev.referencePerson || {}),
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  const updateSource = (value) => {
    setFormData((prev) => ({
      ...prev,
      referenceSource: value,
      referencePerson:
        value === "Person Referral"
          ? (prev.referencePerson || { name: "", designation: "", contact: "" })
          : { name: "", designation: "", contact: "" }
    }));
    setIsDirty(true);
  };

  return (
    <div className="rounded-xl shadow p-4 grid grid-cols-1 gap-6 ">
      <Select
        label="Referred Through"
        required
        value={formData?.referenceSource || ""}
        disabled={readOnly}
        options={[
          "Indeed",
          "Hiring Agency",
          "Person Referral",
          "Company Career Page"
        ]}
        onChange={updateSource}
      />

      {formData?.referenceSource === "Person Referral" && (
        <div className="p-5 bg-white grid grid-cols-3 gap-4">
          <Input
            label="Name"
            required
            value={referencePerson.name}
            disabled={readOnly}
            onChange={(v) => updateRefPerson("name", v)}
          />

          <Input
            label="Designation"
            required
            value={referencePerson.designation}
            disabled={readOnly}
            onChange={(v) => updateRefPerson("designation", v)}
          />

          <Input
            label="Contact Number"
            required
            value={referencePerson.contact}
            disabled={readOnly}
            onChange={(v) => updateRefPerson("contact", v)}
          />
        </div>
      )}
    </div>
  );
}