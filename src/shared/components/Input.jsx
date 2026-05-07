import React from "react";

export default function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <div className="flex flex-col">
      {label && <label className="mb-1 font-medium text-gray-700">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="border px-3 py-2 rounded-md focus:outline-none focus:ring-1 focus:ring-black-300"
      />
    </div>
  );
}
