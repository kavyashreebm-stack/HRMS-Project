import React, { useState, useRef, useEffect } from "react";

/* ✅ INPUT */
export const Input = ({
  label,
  required,
  value,
  onChange,
  disabled,
  type = "text",
  error,
  ...props
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">
      {label} {required && "*"}
    </label>

    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400
                  focus:border-gray-400 transition rounded ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
      {...props}
    />

    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

/* ✅ TEXTAREA (NEW) */
export const Textarea = ({
  label,
  required,
  value,
  onChange,
  disabled,
  error,
  rows = 3,
  ...props
}) => (
  <div className="mb-4">
    <label className="block text-sm font-medium mb-1">
      {label} {required && "*"}
    </label>

    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`w-full border px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400
                  focus:border-gray-400 transition rounded resize-none ${
                    error ? "border-red-500" : "border-gray-300"
                  }`}
      {...props}
    />

    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

export const Select = ({
  label,
 required,
  value,
  onChange,
  options = [],
  disabled,
}) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef();

  /* Normalize options (supports strings OR objects) */
  const normalized = options.map((opt) =>
    typeof opt === "string"
      ? { label: opt, value: opt }
      : opt
  );

  const selected = normalized.find((o) => o.value === value);

  const handleSelect = (opt) => {
    onChange(opt.value); // ✅ store VALUE only
    setOpen(false);
  };

  React.useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="mb-4 relative" ref={ref}>
      <label className="block text-sm font-medium mb-1">
        {label} {required && "*"}
      </label>

      <div
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && setOpen(!open)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen(!open);
          }
        }}
        className={`
          w-full border border-gray-300 px-2 py-1 text-sm rounded
          flex justify-between items-center transition-all focus:ring-1 focus:ring-gray-400 focus:border-gray-400 outline-none
          ${disabled ? "bg-white cursor-not-allowed opacity-60" : "bg-white cursor-pointer hover:border-gray-400"}
        `}
      >
        <span className="text-sm text-black">
          {selected ? selected.label : "Select..."}
        </span>

        <span className="text-xs text-black transition-transform duration-200" style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </div>

      {open && (
        <div className="absolute w-full mt-1 bg-white border rounded shadow-lg z-50">
          {normalized.map((opt) => (
            <div
              key={opt.value}
              onClick={() => handleSelect(opt)}
              className="
                px-3 py-2 text-sm cursor-pointer
                hover:bg-[#0057B8] hover:text-white
                transition
              "
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};