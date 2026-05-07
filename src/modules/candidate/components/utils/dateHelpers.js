export const formatMMYYYY = (value) => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  let formatted = cleaned;
  if (cleaned.length > 2) {
    formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}`;
  }
  return formatted.slice(0, 7);
};

export const isValidMMYYYY = (value) => {
  if (!value) return false;
  const parts = value.split("-");
  if (parts.length !== 2) return false;
  const [mm, yyyy] = parts.map(Number);
  if (isNaN(mm) || isNaN(yyyy)) return false;
  return mm >= 1 && mm <= 12 && yyyy >= 1900 && yyyy <= 2100;
};

export const isValidDate = (value) => {
  if (!value) return false;
  // Handle MM-YYYY
  if (value.length === 7 && value.includes("-")) {
    return isValidMMYYYY(value);
  }
  // Handle DD-MM-YYYY
  const parts = value.split("-");
  if (parts.length !== 3) return false;
  const [dd, mm, yyyy] = parts.map(Number);
  const d = new Date(yyyy, mm - 1, dd);
  return d.getFullYear() === yyyy && d.getMonth() === mm - 1 && d.getDate() === dd;
};

export const parseDate = (dateStr) => {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length === 2) {
    // MM-YYYY -> Assume first of month
    const [mm, yyyy] = parts.map(Number);
    return new Date(yyyy, mm - 1, 1);
  }
  if (parts.length === 3) {
    const [dd, mm, yyyy] = parts.map(Number);
    return new Date(yyyy, mm - 1, dd);
  }
  return null;
};

export const calculateExperience = (from, to) => {
  const start = parseDate(from);
  const end = to ? parseDate(to) : new Date();
  if (!start || isNaN(start) || !end || isNaN(end) || end < start) return "N/A";

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  if (months < 0) { years--; months += 12; }

  if (years === 0) return `${months} month(s)`;
  if (months === 0) return `${years} year(s)`;
  return `${years} year(s) ${months} month(s)`;
};