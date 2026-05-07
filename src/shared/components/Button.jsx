import React from "react";

export default function Button({ children, onClick, type = "button", className = "" }) {
  return (
    <button
      type={type}
      onClick={onClick}

      className={`px-4 py-2 bg-red-600 text-white rounded hover:bg-grey-700 boarder ${className}`}
      
    >
      {children}
    </button>
  );
}
