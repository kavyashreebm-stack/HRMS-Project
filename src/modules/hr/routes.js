import React from "react";
import { Route } from "react-router-dom";
import HRDashboard from "./pages/HRDashboard";
import HRAllApplications from "./pages/HRAllApplications";
import HRJobPostings from "./pages/HRJobPostings";

export const hrRoutes = (
  <>
    <Route path="/hr/dashboard" element={<HRDashboard />} />
    <Route path="/hr/all-applications" element={<HRAllApplications />} />
    <Route path="/hr/job-postings" element={<HRJobPostings />} />
  </>
);