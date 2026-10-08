import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import Layout from "./Layout";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

type Props = {
  children: ReactNode;
  requireBaseline?: boolean;
  /** At least one weekly submission recorded */
  requireWeeklySubmission?: boolean;
};

export default function JourneyRoute({
  children,
  requireBaseline = false,
  requireWeeklySubmission = false
}: Props) {
  const { loading, baselineCompleted, hasWeeklySubmission, isParticipantJourney } =
    useParticipantJourney();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const isPreviewMode =
    import.meta.env.DEV &&
    location.pathname === "/participant-welcome" &&
    new URLSearchParams(location.search).get("preview") === "1";

  if (isPreviewMode) {
    return children;
  }

  if (role === "admin") {
    return children;
  }

  if (loading) {
    return (
      <Layout>
        <p className="text-sm text-slate-600">Loading your journey…</p>
      </Layout>
    );
  }

  if (!isParticipantJourney || !localStorage.getItem("participant_id")) {
    return <Navigate to="/login" replace />;
  }

  if (requireBaseline && !baselineCompleted) {
    return <Navigate to="/baseline" replace />;
  }

  if (requireWeeklySubmission && !hasWeeklySubmission) {
    return <Navigate to="/weekly" replace />;
  }

  return children;
}
