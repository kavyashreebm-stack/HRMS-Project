import React from 'react';
import { Input, Select } from '../ui/FormElements';

export default function MedicalDetails({ formData = {}, setFormData, readOnly = false, setIsDirty = () => {} }) {

  // Safe fallback for medical data
  const medical = formData.medical || {
    bloodGroup: "",
    hasDisability: "No",
    disabilityYears: "",
    hasCondition: "No",
    conditionYears: ""
  };

  const updateMedical = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      medical: {
        ...(prev.medical || {}),
        [field]: value
      }
    }));
    setIsDirty(true);
  };

  return (
    <div className="max-w-xl rounded-xl shadow-sm p-4 space-y-4">
      <Select 
        label="Blood Group" 
        required 
        value={medical.bloodGroup} 
        options={["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]} 
        disabled={readOnly} 
        onChange={(v) => updateMedical("bloodGroup", v)} 
      />
      
      <Select 
        label="Known Disability" 
        required 
        value={medical.hasDisability} 
        options={["Yes", "No"]} 
        disabled={readOnly} 
        onChange={(v) => updateMedical("hasDisability", v)} 
      />
      
      {medical.hasDisability === "Yes" && (
        <Input 
          label="Years of Disability" 
          required 
          value={medical.disabilityYears} 
          disabled={readOnly} 
          onChange={(v) => updateMedical("disabilityYears", v)} 
        />
      )}

      <Select 
        label="Known Medical Conditions" 
        required 
        value={medical.hasCondition} 
        options={["Yes", "No"]} 
        disabled={readOnly} 
        onChange={(v) => updateMedical("hasCondition", v)} 
      />
      
      {medical.hasCondition === "Yes" && (
        <Input 
          label="Condition Since (Years)" 
          required 
          value={medical.conditionYears} 
          disabled={readOnly} 
          onChange={(v) => updateMedical("conditionYears", v)} 
        />
      )}
    </div>
  );
}