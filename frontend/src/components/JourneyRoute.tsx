import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
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
  const role = localStorage.getItem("role");

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
    return <Navigate to="/" replace />;
  }

  if (requireBaseline && !baselineCompleted) {
    return <Navigate to="/baseline" replace />;
  }

  if (requireWeeklySubmission && !hasWeeklySubmission) {
    return <Navigate to="/weekly" replace />;
  }

  return children;
}
