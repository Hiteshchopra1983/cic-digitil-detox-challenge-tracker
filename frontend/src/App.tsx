import { BrowserRouter, Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import BaselinePage from "./pages/BaselinePage";
import WeeklySubmitPage from "./pages/WeeklySubmitPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import ImpactSummaryPage from "./pages/ImpactSummaryPage";
import AdminParticipantsPage from "./pages/AdminParticipantsPage";
import AdminImpactPage from "./pages/AdminImpactPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import AdminFactorsPage from "./pages/AdminFactorsPage";
import AdminAuditPage from "./pages/AdminAuditPage";
import { ParticipantJourneyProvider } from "./contexts/ParticipantJourneyContext";
import JourneyRoute from "./components/JourneyRoute";

export default function App() {
  return (
    <BrowserRouter>
      <ParticipantJourneyProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route
            path="/dashboard"
            element={
<<<<<<< HEAD
              <JourneyRoute requireBaseline requireWeeklySubmission>
=======
              <JourneyRoute requireBaseline>
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
                <DashboardPage />
              </JourneyRoute>
            }
          />

          <Route path="/baseline" element={<BaselinePage />} />

          <Route
            path="/weekly"
            element={
              <JourneyRoute requireBaseline>
                <WeeklySubmitPage />
              </JourneyRoute>
            }
          />

          <Route path="/profile" element={<ProfilePage />} />

          <Route
            path="/leaderboard"
            element={
<<<<<<< HEAD
              <JourneyRoute requireBaseline requireWeeklySubmission>
=======
              <JourneyRoute requireBaseline>
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
                <LeaderboardPage />
              </JourneyRoute>
            }
          />

          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route
            path="/impact-summary"
            element={
<<<<<<< HEAD
              <JourneyRoute requireBaseline requireWeeklySubmission>
=======
              <JourneyRoute requireBaseline>
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
                <ImpactSummaryPage />
              </JourneyRoute>
            }
          />
          <Route path="/admin/participants" element={<AdminParticipantsPage />} />
          <Route path="/admin/impact" element={<AdminImpactPage />} />
          <Route path="/admin/config" element={<AdminConfigPage />} />
          <Route path="/admin/factors" element={<AdminFactorsPage />} />
          <Route path="/admin/audit" element={<AdminAuditPage />} />
        </Routes>
      </ParticipantJourneyProvider>
    </BrowserRouter>
  );
}