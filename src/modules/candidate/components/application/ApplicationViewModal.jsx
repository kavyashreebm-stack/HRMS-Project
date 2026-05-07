import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText } from "lucide-react";
import jsPDF from "jspdf";
import API, { FILE_BASE_URL } from "../../../../api";

export default function ApplicationViewModal({ application, onClose }) {
  const formRef = useRef();

  // ─── Normalization: Handle backend (snake_case/nested) vs frontend (camelCase) ───
  const profile = application.candidate_profile || application.candidateProfile || {};
  
  const normalizedApp = {
    ...application,
    ...profile,
    // Basic Details
    name: application.name || profile.name,
    currentAddress: application.current_address || application.currentAddress || profile.correspondence_address || profile.currentAddress,
    permanentAddress: application.permanent_address || application.permanentAddress || profile.permanent_address || profile.permanentAddress,
    mobile: application.mobile_no || application.mobile || profile.phone_number || profile.mobile,
    dob: application.date_of_birth || application.dob || profile.date_of_birth || profile.dob,
    email: application.email_id || application.email || profile.email,
    experienceStatus: application.experience_type || application.experienceStatus,

    // Other Details (flattened from other_details if present)
    ...(application.other_details || {}),

    // Lists
    education: (application.education_snapshot || profile.education || application.education || []).map(edu => ({
      ...edu,
      yearPassing: edu.yearPassing || edu.to || edu.to_date || "",
    })),
    technicalQualifications: (application.technical_skills || profile.technical_qualifications || profile.technicalQualifications || application.technicalQualifications || []).map(tech => ({
      ...tech,
      yearPassing: tech.yearPassing || tech.to || tech.to_date || "",
    })),
    employmentHistory: (application.employment_snapshot || profile.employment || profile.employment_history || profile.employmentHistory || application.employmentHistory || []).map(emp => ({
      ...emp,
      companyName: emp.companyName || emp.organization || "",
      durationFrom: emp.durationFrom || emp.from || emp.from_date || "",
      durationTo: emp.durationTo || emp.to || emp.to_date || "",
    })),

    // Files
    photoSrc: (application.photo_path || profile.photo_path)
      ? ((application.photo_path || profile.photo_path).includes("://") || (application.photo_path || profile.photo_path).startsWith("data:") || (application.photo_path || profile.photo_path).startsWith("blob:")
          ? (application.photo_path || profile.photo_path)
          : `${FILE_BASE_URL}/${(application.photo_path || profile.photo_path).replace(/^\/+/, "")}`)
      : (application.photo?.url || application.photo?.data || profile.photo?.url || null),
    resumeSrc: (application.resume_path || profile.resume_path)
      ? ((application.resume_path || profile.resume_path).startsWith("blob:") || (application.resume_path || profile.resume_path).startsWith("data:") || (application.resume_path || profile.resume_path).startsWith("http")
          ? (application.resume_path || profile.resume_path) 
          : `${FILE_BASE_URL}/${application.resume_path || profile.resume_path}`)
      : (application.resume?.url || profile.resume?.url || null),
  };

  const appNumber = normalizedApp.appNumber || `AE-APP-${new Date(normalizedApp.createdAt || Date.now()).getFullYear()}-${String(normalizedApp.id || 0).padStart(4, "0")}`;

  // ─── Helper to fetch and convert image to Base64 for jsPDF ────────────────
  const getBase64Image = async (url) => {
    if (!url) return null;
    
    // Fallback 1: Try to grab from DOM if already rendered
    const imgFromDOM = document.querySelector(`img[src="${url}"]`);
    if (imgFromDOM && imgFromDOM.complete && imgFromDOM.naturalWidth !== 0) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = imgFromDOM.naturalWidth;
        canvas.height = imgFromDOM.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgFromDOM, 0, 0);
        return canvas.toDataURL("image/jpeg");
      } catch (e) {
        console.warn("[PDF] DOM Image capture failed (CORS), falling back to fetch...", e);
      }
    }

    // Fallback 2: Network fetch (trying multiple origins to match environment)
    const urlsToTry = [url];
    if (url.includes("127.0.0.1")) urlsToTry.push(url.replace("127.0.0.1", "localhost"));
    else if (url.includes("localhost")) urlsToTry.push(url.replace("localhost", "127.0.0.1"));
    
    for (const u of urlsToTry) {
      try {
        console.log(`[PDF] Attempting fetch from: ${u}`);
        const response = await fetch(u);
        if (!response.ok) continue;
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error(`[PDF] Fetch failed for ${u}:`, err);
      }
    }
    return null;
  };

  // ─── Programmatic PDF — no HTML/CSS rendering at all ────────────────────────
  const handleDownloadPDF = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const W = 210;
    const margin = 10;
    const usable = W - margin * 2;
    let y = margin;

    const app = normalizedApp;
    const dateStr = app.createdAt
      ? new Date(app.createdAt).toLocaleDateString("en-GB")
      : new Date().toLocaleDateString("en-GB");
    const skills = Array.isArray(app.skills) ? app.skills.join(", ") : app.skills || "";
    const languages = Array.isArray(app.languages) ? app.languages.join(", ") : app.languages || "";

    const formatDateToDDMMYYYY = (dateStr) => {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      if (y && m && d && y.length === 4) return `${d}-${m}-${y}`;
      const dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) return dateStr;
      return `${String(dateObj.getDate()).padStart(2, "0")}-${String(dateObj.getMonth() + 1).padStart(2, "0")}-${dateObj.getFullYear()}`;
    };

    // ── Helpers ──────────────────────────────────────────────────────────────
    const border = () => { pdf.setDrawColor(0, 0, 0); pdf.setLineWidth(0.15); };

    const getCellHeight = (text, w, fontSize) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(String(text || ""), w - 3);
      const lineHeight = fontSize * 0.45; // mm per pt approx
      return Math.max(6.5, lines.length * lineHeight + 2);
    };

    const drawCell = (text, x, cy, w, h, isLabel = false) => {
      border();
      if (isLabel) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(x, cy, w, h, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.5);
        pdf.setTextColor(71, 85, 105);
      } else {
        pdf.rect(x, cy, w, h, "S");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(8.5);
        pdf.setTextColor(30, 41, 59);
      }
      
      const lines = pdf.splitTextToSize(String(text || ""), w - 3);
      const fontSize = isLabel ? 7.5 : 8.5;
      const lineHeight = fontSize * 0.4; // tighter line height for centering
      const totalTextHeight = lines.length * lineHeight;
      const startY = cy + (h - totalTextHeight) / 2 + lineHeight - 0.5;
      
      pdf.text(lines, x + 1.5, startY);
    };

    const sectionRow = (title, cy) => {
      border();
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, cy, usable, 6, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(8.5);
      pdf.setTextColor(0, 0, 0);
      pdf.text(title.toUpperCase(), margin + 2, cy + 4.2);
      return cy + 6;
    };

    const fullRow = (label, value, cy, width = usable) => {
      const lw = 45;
      const vw = width - lw;
      const lh = getCellHeight(label, lw, 7.5);
      const vh = getCellHeight(value, vw, 8.5);
      const h = Math.max(lh, vh);
      drawCell(label, margin, cy, lw, h, true);
      drawCell(value, margin + lw, cy, vw, h, false);
      return cy + h;
    };

    const splitRow = (l1, v1, l2, v2, cy, width = usable) => {
      const half = width / 2;
      const lw = 35; // reduced label width for split rows
      const vw = half - lw;
      
      const h1 = Math.max(getCellHeight(l1, lw, 7.5), getCellHeight(v1, vw, 8.5));
      const h2 = Math.max(getCellHeight(l2, lw, 7.5), getCellHeight(v2, vw, 8.5));
      const h = Math.max(h1, h2);

      drawCell(l1, margin, cy, lw, h, true);
      drawCell(v1, margin + lw, cy, vw, h, false);
      drawCell(l2, margin + half, cy, lw, h, true);
      drawCell(v2, margin + half + lw, cy, vw, h, false);
      return cy + h;
    };

    // ── HEADER ────────────────────────────────────────────────────────────────
    border();
    pdf.rect(margin, y, usable, 22, "S");

    // Company name – RED, BOLD & CENTERED
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.setTextColor(220, 38, 38);
    pdf.text("AUTOCRAT ENGINEERS", W / 2, y + 8, { align: "center", charSpace: 0.5 });

    // Address - Centered
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(7);
    pdf.setTextColor(31, 41, 55);
    pdf.text(
      "PLOT NO. 21 & 22, EXPORT PROMOTION INDUSTRIAL PARK, PHASE 1, WHITEFIELD, BENGALURU-560066",
      W / 2, y + 12.5, { align: "center" }
    );
    pdf.text("KARNATAKA-INDIA", W / 2, y + 15.5, { align: "center" });

    // Subtitle Section
    pdf.setDrawColor(209, 213, 219);
    pdf.setLineWidth(0.15);
    pdf.line(margin + 5, y + 17.5, margin + usable - 5, y + 17.5);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(17, 24, 39);
    pdf.text("INTERVIEW APPLICATION FORM", W / 2, y + 20.5, { align: "center" });

    y += 22.5;

    // ── REG / DATE ROW ────────────────────────────────────────────────────────
    const half = usable / 2;
    const lwr = 30; // fixed label width
    const vwr = half - lwr;
    drawCell("REG NO :", margin, y, lwr, 7, true);
    drawCell(appNumber, margin + lwr, y, vwr, 7, false);
    drawCell("DATE :", margin + half, y, lwr, 7, true);
    drawCell(dateStr, margin + half + lwr, y, vwr, 7, false);
    y += 7;

    // ── SECTION 1: PERSONAL DETAILS ──────────────────────────────────────────
    const sectionRowStartY = y;
    y = sectionRow("1). PERSONAL DETAILS", y);
    const photoW = 35;
    const tableW = usable - photoW;

    y = splitRow("Name :", (app.name || "").toUpperCase(), "Department :", (app.department || "").toUpperCase(), y, tableW);
    y = fullRow("Current Address :", (app.currentAddress || "").toUpperCase(), y, tableW);
    y = fullRow("Permanent Address :", (app.permanentAddress || "").toUpperCase(), y, tableW);
    y = splitRow("Mobile No :", (app.mobile || "").toUpperCase(), "Date of Birth :", formatDateToDDMMYYYY(app.dob), y, tableW);
    y = splitRow("Email ID :", (app.email || "").toLowerCase(), "Exp. Status :", (app.experienceStatus || "").toUpperCase(), y, tableW);

    // Photo Box Positioning logic
    const photoH = 37.5; 
    const photoY = sectionRowStartY + 7.5;
    border();
    pdf.rect(margin + usable - photoW, photoY, photoW, photoH, "S");
    
    const photoSrc = app.photoSrc;
    if (photoSrc) {
      try {
        const base64Photo = await getBase64Image(photoSrc);
        if (base64Photo) {
          const format = base64Photo.includes("png") ? "PNG" : "JPEG";
          pdf.addImage(base64Photo, format, margin + usable - photoW + 0.5, photoY + 0.5, photoW - 1, photoH - 1);
        }
      } catch (err) {
        console.error("PDF Photo Add Error:", err);
      }
    }
    
    // Ensure y is past the photo if photo is taller than personal details
    y = Math.max(y, photoY + photoH);
    y += 2; // small padding

    // ── SECTION 2: OTHER DETAILS ──────────────────────────────────────────
    y = sectionRow("2). OTHER DETAILS", y);
    y = splitRow("Source :", (app.source || "Direct Access").toUpperCase(), "Availability :", formatDateToDDMMYYYY(app.availability), y);
    y = splitRow("Worked at AE before :", app.aeBefore === "yes" ? "YES" : "NO", "Referral? :", app.referred === "yes" ? "YES" : "NO", y);
    if (app.referred === "yes") {
      y = splitRow("Referrer :", (app.refName || "").toUpperCase(), "Ref Dept :", (app.refDept || "").toUpperCase(), y);
      y = splitRow("Ref Mobile :", app.refMobile || "", "Languages :", (app.languages || []).join(", ").toUpperCase(), y);
    } else {
      y = fullRow("Languages Known :", (app.languages || []).join(", ").toUpperCase(), y);
    }
    y += 3;


    // ── SECTION 3: EDUCATIONAL DETAILS ──────────────────────────────────────────
    y = sectionRow("3). EDUCATIONAL DETAILS", y);
    const eduCw = [usable * 0.22, usable * 0.33, usable * 0.2, usable * 0.25];
    const eduCx = [margin, margin + eduCw[0], margin + eduCw[0] + eduCw[1], margin + eduCw[0] + eduCw[1] + eduCw[2]];

    // Header
    pdf.setFillColor(241, 245, 249);
    eduCw.forEach((w, i) => { border(); pdf.rect(eduCx[i], y, w, 5.5, "FD"); });
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7);
    ["DEGREE", "INSTITUTE", "YEAR (MM-YYYY)", "SPECIALIZATION"].forEach((h, i) => pdf.text(h, eduCx[i] + 1.5, y + 4));
    y += 5.5;

    (app.education || []).forEach(edu => {
      const h = Math.max(
        6.5,
        getCellHeight(edu.degree, eduCw[0], 7),
        getCellHeight(edu.institute, eduCw[1], 7),
        getCellHeight(edu.yearPassing, eduCw[2], 7),
        getCellHeight(edu.specialization, eduCw[3], 7)
      );

      eduCw.forEach((w, i) => { border(); pdf.rect(eduCx[i], y, w, h, "S"); });
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7);
      drawCell(edu.degree.toUpperCase(), eduCx[0], y, eduCw[0], h, false);
      drawCell(edu.institute.toUpperCase(), eduCx[1], y, eduCw[1], h, false);
      drawCell(edu.yearPassing.toUpperCase(), eduCx[2], y, eduCw[2], h, false);
      drawCell(edu.specialization.toUpperCase(), eduCx[3], y, eduCw[3], h, false);
      y += h;
    });
    y += 3;

    // ── SECTION 4: TECHNICAL QUALIFICATIONS ──────────────────────────────────────
    y = sectionRow("4). TECHNICAL QUALIFICATIONS", y);
    const techCw = [usable * 0.35, usable * 0.45, usable * 0.2];
    const techCx = [margin, margin + techCw[0], margin + techCw[0] + techCw[1]];

    // Header
    pdf.setFillColor(241, 245, 249);
    techCw.forEach((w, i) => { border(); pdf.rect(techCx[i], y, w, 5.5, "FD"); });
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5);
    ["COURSE/SPECIALISATION", "INSTITUTE", "DATE (MM-YYYY)"].forEach((h, i) => pdf.text(h, techCx[i] + 1.5, y + 4));
    y += 5.5;

    (app.technicalQualifications || []).forEach(tech => {
      const h = Math.max(
        6.5,
        getCellHeight(tech.course, techCw[0], 7),
        getCellHeight(tech.institute, techCw[1], 7),
        getCellHeight(tech.yearPassing, techCw[2], 7)
      );

      techCw.forEach((w, i) => { border(); pdf.rect(techCx[i], y, w, h, "S"); });
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7);
      drawCell(tech.course.toUpperCase(), techCx[0], y, techCw[0], h, false);
      drawCell(tech.institute.toUpperCase(), techCx[1], y, techCw[1], h, false);
      drawCell(tech.yearPassing.toUpperCase(), techCx[2], y, techCw[2], h, false);
      y += h;
    });
    y += 3;

    // ── SECTION 5: EMPLOYMENT HISTORY ──────────────────────────────────────────
    const isExperienced = app.experienceStatus === "experienced";
    y = sectionRow("5). PREVIOUS EMPLOYMENT DETAIL", y);
    y = fullRow("Total Work Experience :", isExperienced ? (app.totalExperience || "").toUpperCase() : "0 YEARS (FRESHER)", y);

    if (isExperienced && (app.employmentHistory || []).length > 0) {
      const empCw = [usable * 0.3, usable * 0.3, usable * 0.2, usable * 0.2];
      const empCx = [margin, margin + empCw[0], margin + empCw[0] + empCw[1], margin + empCw[0] + empCw[1] + empCw[2]];

      // Header
      pdf.setFillColor(241, 245, 249);
      empCw.forEach((w, i) => { border(); pdf.rect(empCx[i], y, w, 5.5, "FD"); });
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(7);
      ["COMPANY", "DESIGNATION", "FROM (MM-YYYY)", "TO (MM-YYYY)"].forEach((h, i) => pdf.text(h, empCx[i] + 1.5, y + 4));
      y += 5.5;

      (app.employmentHistory || []).forEach(emp => {
        const h = Math.max(
          6.5,
          getCellHeight(emp.companyName, empCw[0], 7),
          getCellHeight(emp.designation, empCw[1], 7),
          getCellHeight(emp.durationFrom, empCw[2], 7),
          getCellHeight(emp.durationTo, empCw[3], 7)
        );

        empCw.forEach((w, i) => { border(); pdf.rect(empCx[i], y, w, h, "S"); });
        pdf.setFont("helvetica", "normal"); pdf.setFontSize(7);
        drawCell(emp.companyName.toUpperCase(), empCx[0], y, empCw[0], h, false);
        drawCell(emp.designation.toUpperCase(), empCx[1], y, empCw[1], h, false);
        drawCell(emp.durationFrom.toUpperCase(), empCx[2], y, empCw[2], h, false);
        drawCell(emp.durationTo.toUpperCase(), empCx[3], y, empCw[3], h, false);
        y += h;
      });
    } else {
      // Show placeholder for freshers
      y = fullRow("Current Status :", "CANDIDATE IS A FRESHER - NO PREVIOUS EMPLOYMENT HISTORY", y);
    }
    y += 3;

    // ── SECTION 6: DOCUMENT REGISTRY ─────────────────────────────────────────
    y = sectionRow("6). DOCUMENT REGISTRY", y);
    const cw = [10, 60, 85, 35];
    const cx = [margin, margin + 10, margin + 70, margin + 155];

    // Header
    pdf.setFillColor(241, 245, 249);
    cw.forEach((w, i) => { border(); pdf.rect(cx[i], y, w, 5.5, "FD"); });
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5);
    ["SL", "DOCUMENT TITLE", "FILE NAME", "STATUS"].forEach((h, i) => pdf.text(h, cx[i] + 1, y + 4));
    y += 5.5;

    const docRow = (sl, title, fname, status, cy) => {
      const h = Math.max(
        6.5,
        getCellHeight(title, cw[1], 7),
        getCellHeight(fname, cw[2], 7)
      );

      cw.forEach((w, i) => { border(); pdf.rect(cx[i], cy, w, h, "S"); });
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(7);
      drawCell(sl, cx[0], cy, cw[0], h, false);
      drawCell(title, cx[1], cy, cw[1], h, false);
      drawCell(fname, cx[2], cy, cw[2], h, false);
      drawCell(status, cx[3], cy, cw[3], h, false);
      return cy + h;
    };

    y = docRow("1", "Professional Resume / CV", app.resume?.name || (app.resumeSrc ? "Resume Uploaded" : "No Resume Provided"), app.resumeSrc ? "UPLOADED" : "PENDING", y);
    y = docRow("2", "Identity Photograph", app.photo?.name || (app.photoSrc ? "Attached" : "Not Provided"), app.photoSrc ? "ATTACHED" : "MISSING", y);
    y += 3;

    // ── DECLARATION ───────────────────────────────────────────────────────────
    border();
    pdf.rect(margin, y, usable, 25, "S");
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(0, 0, 0);
    pdf.text("CANDIDATE DECLARATION:", margin + 3, y + 4);
    pdf.setFont("helvetica", "italic"); pdf.setFontSize(6.5); pdf.setTextColor(60, 60, 60);
    pdf.text(
      "I hereby declare that the information provided in this application is true and complete to the best of my knowledge. I authorize Autocrat Engineers to verify all information provided.",
      margin + 3, y + 7.5,
      { maxWidth: usable - 6 }
    );

    pdf.line(margin + 5, y + 20, margin + 65, y + 20);
    pdf.line(margin + usable - 65, y + 20, margin + usable - 5, y + 20);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(7); pdf.setTextColor(0, 0, 0);
    pdf.text(`DATE: ${dateStr}`, margin + usable - 65, y + 23);
    // Signature lines
    pdf.setDrawColor(0, 0, 0);
    pdf.line(margin + 5, y + 25, margin + 60, y + 25);
    pdf.line(margin + usable - 60, y + 25, margin + usable - 5, y + 25);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(6.5); pdf.setTextColor(0, 0, 0);
    pdf.text("DATE: " + dateStr, margin + usable - 60, y + 30);

    // ── FOOTER ────────────────────────────────────────────────────────────────
    y = Math.min(y + 25, 290);

    pdf.save(`Application_${(app.name || "Candidate").replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white w-full max-w-5xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200"
        >
          {/* Action Header */}
          <div className="px-6 py-3 bg-gray-50 border-b flex justify-between items-center shrink-0">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-gray-600" />
              <h2 className="text-md font-bold text-gray-800">Application Document Preview</h2>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleDownloadPDF} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow-lg shadow-blue-100">
                <Download size={14} /> Download PDF
              </button>
              <button onClick={onClose} className="ml-2 p-1 text-gray-400 hover:text-red-500 rounded transition-all">
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Sequential Content Area */}
          <div className="flex-1 overflow-y-auto bg-gray-100 p-8 flex justify-center items-start">
            <div
              ref={formRef}
              className="bg-white w-full max-w-[210mm] min-h-[297mm] h-max shadow-lg p-8 flex flex-col text-black"
              style={{ fontFamily: "'Arial', sans-serif", fontSize: "11.5px" }}
            >
              {/* Header Box */}
              <div className="border border-black p-3 mb-2 flex flex-col items-center text-center">
                <h1 className="text-3xl font-black text-red-600 tracking-widest mb-1">AUTOCRAT ENGINEERS</h1>

                <p className="text-[10px] font-bold text-gray-800 leading-relaxed uppercase">
                  Plot No. 21 &amp; 22, Export Promotion Industrial Park, Phase 1, Whitefield, Bengaluru-560066 <br />
                  KARNATAKA-INDIA
                </p>

                <div className="w-full border-t border-gray-300 mt-2 pt-2">
                  <h2 className="text-sm font-bold text-gray-900 tracking-widest uppercase">Candidate Application Form</h2>
                </div>
              </div>

              {/* Application Details Bar */}
              <div className="flex border border-black border-b-0 text-[10px]">
                <div className="flex-1 border-r border-black p-2 flex bg-transparent">
                  <span className="font-bold w-40 uppercase">Registration No :</span>
                  <span className="font-bold text-blue-800 text-[12px]">{appNumber}</span>
                </div>
                <div className="flex-1 p-2 flex">
                  <span className="font-bold w-40 uppercase">Application Date :</span>
                  <span className="font-bold text-[12px]">{normalizedApp.createdAt ? new Date(normalizedApp.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Section 1: PERSONAL DETAILS */}
              <div className="section-header p-2 bg-gray-50 font-bold border border-black uppercase text-[10px]">1). PERSONAL DETAILS</div>
              <div className="flex border border-black border-t-0">
                <div className="flex-1 min-w-0">
                  <table className="w-full h-full border-collapse table-fixed text-[11px]">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Name :</td>
                        <td className="p-1.5 value break-words">{normalizedApp.name}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Department Applying For :</td>
                        <td className="p-1.5 value uppercase break-words">{normalizedApp.department}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Current Address :</td>
                        <td className="p-1.5 value break-words">{normalizedApp.currentAddress}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Permanent Address :</td>
                        <td className="p-1.5 value break-words">{normalizedApp.permanentAddress}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Mobile No :</td>
                        <td className="p-1.5 value break-words">{normalizedApp.mobile}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Date of Birth :</td>
                        <td className="p-1.5 value break-words">{normalizedApp.dob}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Email ID :</td>
                        <td className="p-1.5 value break-words">{normalizedApp.email}</td>
                      </tr>
                      <tr>
                        <td className="p-1.5 label border-r border-black w-[140px] text-[10px]">Fresher / Experienced :</td>
                        <td className="p-1.5 value uppercase font-bold break-words">{normalizedApp.experienceStatus}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="w-40 border-l border-black p-3 flex flex-col items-center justify-center bg-transparent">
                  <div className="w-32 h-40 border border-black bg-white flex items-center justify-center relative overflow-hidden shadow-inner">
                    {normalizedApp.photoSrc ? (
                      <img 
                        src={normalizedApp.photoSrc} 
                        alt="Candidate" 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="text-[9px] text-gray-400 font-bold text-center p-2 uppercase">Paste Photograph Here</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: OTHER DETAILS */}
              <div className="section-header p-2 bg-gray-50 font-bold border border-black uppercase mt-1 text-[10px]">2). OTHER DETAILS</div>
              <table className="w-full border-collapse border border-black border-t-0 text-[10px]">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="p-1 label border-r border-black w-1/4">Source :</td>
                    <td className="p-1 value uppercase">{normalizedApp.source || "Direct Access"}</td>
                    <td className="p-1 label border-l border-r border-black w-1/4">Availability :</td>
                    <td className="p-1 value uppercase">{normalizedApp.availability}</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-1 label border-r border-black w-1/4">Worked at AE before? :</td>
                    <td className="p-1 value uppercase">{normalizedApp.aeBefore === 'yes' ? 'Yes' : 'No'}</td>
                    <td className="p-1 label border-l border-r border-black w-1/4">Referral Application :</td>
                    <td className="p-1 value uppercase">{normalizedApp.referred === 'yes' ? 'Yes' : 'No'}</td>
                  </tr>
                  {normalizedApp.referred === 'yes' && (
                    <tr className="border-b border-black">
                      <td className="p-1 label border-r border-black w-1/4 text-blue-800">Referrer Name :</td>
                      <td className="p-1 value uppercase">{normalizedApp.refName}</td>
                      <td className="p-1 label border-l border-r border-black w-1/4 text-blue-800">Referrer Dept :</td>
                      <td className="p-1 value uppercase">{normalizedApp.refDept}</td>
                    </tr>
                  )}
                  {normalizedApp.referred === 'yes' && (
                    <tr className="border-b border-black">
                      <td className="p-1 label border-r border-black w-1/4 text-blue-800">Referrer Mobile :</td>
                      <td className="p-1 value">{normalizedApp.refMobile}</td>
                      <td className="p-1 label border-l border-r border-black w-1/4">Languages Known :</td>
                      <td className="p-1 value uppercase">{(normalizedApp.languages || []).join(", ")}</td>
                    </tr>
                  )}
                  {normalizedApp.referred !== 'yes' && (
                    <tr className="border-b border-black">
                      <td className="p-1 label border-r border-black w-1/4">Languages Known :</td>
                      <td className="p-1 value uppercase" colSpan={3}>{(normalizedApp.languages || []).join(", ")}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Section 3: EDUCATIONAL DETAILS */}
              <div className="section-header p-1.5 bg-gray-50 font-bold border border-black uppercase mt-1 text-[10px]">3). EDUCATIONAL DETAILS</div>
              <table className="w-full border-collapse border border-black border-t-0 text-center text-[9px]">
                <thead>
                  <tr className="label text-center font-bold bg-gray-50 uppercase">
                    <td className="border-r border-black p-1 w-[20%]">Name of Degree</td>
                    <td className="border-r border-black p-1 w-[35%]">Name of Institute</td>
                    <td className="border-r border-black p-1 w-[20%]">Year (MM-YYYY)</td>
                    <td className="p-1 w-[25%]">Specialization</td>
                  </tr>
                </thead>
                <tbody>
                  {(normalizedApp.education || []).map((edu, idx) => (
                    <tr key={idx} className="border-t border-black">
                      <td className="p-1 border-r border-black text-left uppercase">{edu.degree}</td>
                      <td className="p-1 border-r border-black text-left uppercase">{edu.institute}</td>
                      <td className="p-1 border-r border-black text-center uppercase">{edu.yearPassing}</td>
                      <td className="p-1 text-left uppercase">{edu.specialization}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Section 4: TECHNICAL QUALIFICATIONS */}
              <div className="section-header p-1.5 bg-gray-50 font-bold border border-black uppercase mt-1 text-[10px]">4). TECHNICAL QUALIFICATIONS</div>
              <table className="w-full border-collapse border border-black border-t-0 text-center text-[9px]">
                <thead>
                  <tr className="label text-center font-bold bg-gray-50 uppercase">
                    <td className="border-r border-black p-1 w-[35%]">Course/Specialisation</td>
                    <td className="border-r border-black p-1 w-[45%]">Name of Institute</td>
                    <td className="p-1 w-[20%]">Passing (MM-YYYY)</td>
                  </tr>
                </thead>
                <tbody>
                  {(normalizedApp.technicalQualifications || []).map((tech, idx) => (
                    <tr key={idx} className="border-t border-black">
                      <td className="p-1 border-r border-black text-left uppercase">{tech.course}</td>
                      <td className="p-1 border-r border-black text-left uppercase">{tech.institute}</td>
                      <td className="p-1 uppercase">{tech.yearPassing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Section 5: EMPLOYMENT HISTORY */}
              {normalizedApp.experienceStatus === "experienced" && (
                <>
                  <div className="section-header p-1.5 bg-gray-50 font-bold border border-black uppercase mt-1 text-[10px]">5). PREVIOUS EMPLOYMENT DETAIL</div>
                  <table className="w-full border-collapse border border-black border-t-0 text-center text-[9px]">
                    <thead>
                      <tr className="label text-center font-bold bg-gray-50 uppercase">
                        <td className="border-r border-black p-1 w-[30%]">Company Name</td>
                        <td className="border-r border-black p-1 w-[30%]">Designation</td>
                        <td className="border-r border-black p-1 w-[20%]">From (MM-YYYY)</td>
                        <td className="p-1 w-[20%]">To (MM-YYYY)</td>
                      </tr>
                    </thead>
                    <tbody>
                      {(normalizedApp.employmentHistory || []).map((emp, idx) => (
                        <tr key={idx} className="border-t border-black">
                          <td className="p-1 border-r border-black text-left uppercase">{emp.companyName}</td>
                          <td className="p-1 border-r border-black text-left uppercase">{emp.designation}</td>
                          <td className="p-1 border-r border-black uppercase">{emp.durationFrom}</td>
                          <td className="p-1 uppercase">{emp.durationTo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* Document Registry */}
              <div className="section-header p-1.5 bg-gray-50 font-bold border border-black uppercase mt-1 text-[10px]">
                {normalizedApp.experienceStatus === "experienced" ? "6" : "5"}). DOCUMENT REGISTRY
              </div>
              <table className="w-full border-collapse border border-black border-t-0 text-center text-[9px]">
                <thead>
                  <tr className="label text-center font-bold bg-gray-50 uppercase">
                    <td className="border-r border-black w-10">Sl.</td>
                    <td className="border-r border-black">Document Title</td>
                    <td className="border-r border-black">File Info</td>
                    <td className="w-32 text-center">Action</td>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-black">
                    <td className="p-1 border-r border-black">1</td>
                    <td className="p-1 border-r border-black text-left">Professional Resume / CV</td>
                    <td className="p-1 border-r border-black text-left">{normalizedApp.resume?.name || (normalizedApp.resumeSrc ? "Resume Uploaded" : "No Resume")}</td>
                    <td className="p-1">
                      {normalizedApp.resumeSrc ? (
                        <a href={normalizedApp.resumeSrc} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">VIEW RESUME</a>
                      ) : (
                        <span className="text-gray-400">PENDING</span>
                      )}
                    </td>
                  </tr>
                  <tr className="border-t border-black">
                    <td className="p-1 border-r border-black font-bold">Note</td>
                    <td className="p-1 border-r border-black text-left italic text-gray-500" colSpan={3}>
                      The identity photograph is attached at the top of the personal details section for document integrity.
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* DECLARATION */}
              <div className="mt-2 border border-black p-2 text-justify">
                <p className="font-bold uppercase text-[8px] mb-1 underline">Candidate Declaration:</p>
                <p className="text-[9px] leading-tight italic text-gray-700">
                  I hereby declare that the information provided in this application is true and complete to the best of my knowledge. I authorize Autocrat Engineers to verify all information provided.
                </p>

                <div className="flex justify-between items-end mt-4 px-4">
                  <div className="text-center w-48 border-t border-black pt-1">
                    <p className="text-[8px] font-bold uppercase">Applicant Signature</p>
                  </div>
                  <p className="text-[8px] font-bold uppercase">Date: {new Date().toLocaleDateString('en-GB')}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}