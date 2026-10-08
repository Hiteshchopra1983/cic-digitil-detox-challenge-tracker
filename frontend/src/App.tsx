import { BrowserRouter, Routes, Route } from "react-router-dom";

import WelcomeLandingPage from "./pages/WelcomeLandingPage";
import LoginPage from "./pages/LoginPage";
import GettingStartedPage from "./pages/GettingStartedPage";
import ParticipantWelcomePage from "./pages/ParticipantWelcomePage";
import DashboardPage from "./pages/DashboardPage";
import BaselinePage from "./pages/BaselinePage";
import WeeklySubmitPage from "./pages/WeeklySubmitPage";
import InviteParticipantsPage from "./pages/InviteParticipantsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import SignupPage from "./pages/SignupPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminParticipantsPage from "./pages/AdminParticipantsPage";
import AdminImpactPage from "./pages/AdminImpactPage";
import AdminConfigPage from "./pages/AdminConfigPage";
import AdminFactorsPage from "./pages/AdminFactorsPage";
import AdminAuditPage from "./pages/AdminAuditPage";
import DirectChatWindowPage from "./pages/DirectChatWindowPage";
import { ParticipantJourneyProvider } from "./contexts/ParticipantJourneyContext";
import JourneyRoute from "./components/JourneyRoute";
import AdminRoute from "./components/AdminRoute";

export default function App() {
  return (
    <BrowserRouter>
      <ParticipantJourneyProvider>
        <Routes>
          <Route path="/" element={<WelcomeLandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/signup" element={<SignupPage />} />

          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          <Route path="/getting-started" element={<GettingStartedPage />} />

          <Route
            path="/direct-chat"
            element={
              <JourneyRoute>
                <DirectChatWindowPage />
              </JourneyRoute>
            }
          />

          <Route
            path="/participant-welcome"
            element={
              <JourneyRoute>
                <ParticipantWelcomePage />
              </JourneyRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <JourneyRoute requireBaseline>
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

          <Route
            path="/invite-participants"
            element={
              <JourneyRoute>
                <InviteParticipantsPage />
              </JourneyRoute>
            }
          />

          <Route path="/profile" element={<ProfilePage />} />

          <Route
            path="/leaderboard"
            element={
              <JourneyRoute requireBaseline>
                <LeaderboardPage />
              </JourneyRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/participants"
            element={
              <AdminRoute>
                <AdminParticipantsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/impact"
            element={
              <AdminRoute>
                <AdminImpactPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/config"
            element={
              <AdminRoute>
                <AdminConfigPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/factors"
            element={
              <AdminRoute>
                <AdminFactorsPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AdminAuditPage />
              </AdminRoute>
            }
          />
        </Routes>
      </ParticipantJourneyProvider>
    </BrowserRouter>
  );
}