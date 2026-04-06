import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { useLocation } from "react-router-dom";
import { apiRequest } from "../lib/api";

export type ParticipantJourneyState = {
  loading: boolean;
  /** Baseline row exists and API reports complete */
  baselineCompleted: boolean;
  /** At least one week saved in weekly_progress */
  hasWeeklySubmission: boolean;
  /** Participant (non-admin) journey applies */
  isParticipantJourney: boolean;
  refresh: () => Promise<void>;
};

const defaultState: ParticipantJourneyState = {
  loading: true,
  baselineCompleted: false,
  hasWeeklySubmission: false,
  isParticipantJourney: false,
  refresh: async () => {}
};

const ParticipantJourneyContext = createContext<ParticipantJourneyState>(defaultState);

export function ParticipantJourneyProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [baselineCompleted, setBaselineCompleted] = useState(false);
  const [hasWeeklySubmission, setHasWeeklySubmission] = useState(false);
  const [isParticipantJourney, setIsParticipantJourney] = useState(false);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem("token");
    const participantId = localStorage.getItem("participant_id");
    const role = localStorage.getItem("role");

<<<<<<< HEAD
    if (!token || !participantId || role === "admin") {
      setIsParticipantJourney(false);
      setBaselineCompleted(role !== "admin");
      setHasWeeklySubmission(role !== "admin");
=======
    if (role === "admin") {
      setIsParticipantJourney(false);
      setBaselineCompleted(true);
      setHasWeeklySubmission(true);
      setLoading(false);
      return;
    }

    if (!token || !participantId) {
      setIsParticipantJourney(false);
      setBaselineCompleted(false);
      setHasWeeklySubmission(false);
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
      setLoading(false);
      return;
    }

    setIsParticipantJourney(true);
    setLoading(true);

    try {
      const [baselineRes, progressRes] = await Promise.all([
        apiRequest(`/api/baseline/${participantId}`, "GET"),
        apiRequest(`/api/progress/${participantId}`, "GET")
      ]);

<<<<<<< HEAD
      setBaselineCompleted(!!baselineRes?.baseline_completed);
      const submitted = Number(progressRes?.submitted ?? 0);
      setHasWeeklySubmission(Number.isFinite(submitted) && submitted >= 1);
=======
      // Only trust shape when the call succeeded — `{ error: "..." }` must not clear a good baseline.
      if (baselineRes && !("error" in baselineRes && baselineRes.error)) {
        setBaselineCompleted(!!baselineRes.baseline_completed);
      }
      if (progressRes && !("error" in progressRes && progressRes.error)) {
        const submitted = Number(progressRes.submitted ?? 0);
        setHasWeeklySubmission(Number.isFinite(submitted) && submitted >= 1);
      }
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
    } catch {
      setBaselineCompleted(false);
      setHasWeeklySubmission(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh, location.pathname]);

  const value = useMemo(
    () => ({
      loading,
      baselineCompleted,
      hasWeeklySubmission,
      isParticipantJourney,
      refresh
    }),
    [loading, baselineCompleted, hasWeeklySubmission, isParticipantJourney, refresh]
  );

  return (
    <ParticipantJourneyContext.Provider value={value}>
      {children}
    </ParticipantJourneyContext.Provider>
  );
}

export function useParticipantJourney() {
  return useContext(ParticipantJourneyContext);
}
