import React, { useState } from "react";
import CandidateProfile from "../pages/CandidateProfile";

export default function DashboardProfile() {
  const [editMode, setEditMode] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleEdit = () => setEditMode(true);

  const handleCancelEdit = () => {
    if (isDirty && !window.confirm("Discard changes?")) return;

    setEditMode(false);
    setIsDirty(false);
  };

  const handleSave = async (data) => {
    // Profile data is already saved by CandidateProfile's handleSaveStep via updateCandidateProfile API call
    setEditMode(false);
    setIsDirty(false);
  };

  return (
    <CandidateProfile
      readOnly={!editMode}
      isEditFlow={editMode}
      onEdit={handleEdit}
      onSave={handleSave}
      onCancel={handleCancelEdit}
      setIsDirty={setIsDirty}
      showHeader={false}
    />
  );
}