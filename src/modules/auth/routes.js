import React from "react";
import { Route } from "react-router-dom";
import CandidateLogin from "./pages/CandidateLogin";
import CreateAccount from "./pages/CreateAccount";
import HRLogin from "./pages/HRLogin";


export const authRoutes = (
  <>
    <Route path="/candidate-login" element={<CandidateLogin />} />
    <Route path="/create-account" element={<CreateAccount />} />
    <Route path="/hr-login" element={<HRLogin />} />
  </>
);
