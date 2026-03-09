import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { weeklyApi } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Trash2, Clock, Users, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = (i: number) => ({
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
});

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function WeeklySubmitPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [nextWeek, setNextWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gbDeleted, setGbDeleted] = useState('');
  const [screenTimeChange, setScreenTimeChange] = useState('');
  const [streamingReduction, setStreamingReduction] = useState('');
  const [alumniTouchpoints, setAlumniTouchpoints] = useState('');
  const [ritualCompleted, setRitualCompleted] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/', { replace: true }); return; }
    if (user) loadNextWeek();
  }, [user, authLoading, navigate]);

  const loadNextWeek = async () => {
    if (!user) return;
    setLoading(true);
    try { setNextWeek(await weeklyApi.getNextWeekNumber(user.user_id)); }
    catch (e) { console.error('Error loading week:', e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await weeklyApi.submitWeekly({
        user_id: user.user_id, week_number: nextWeek,
        gb_deleted: Number(gbDeleted) || 0, screen_time_change: Number(screenTimeChange) || 0,
        streaming_reduction: Number(streamingReduction) || 0, alumni_touchpoints: Number(alumniTouchpoints) || 0,
        ritual_completed: ritualCompleted,
      });
      setSubmitted(true);
    } catch (e) { console.error('Error submitting:', e); }
    finally { setSubmitting(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }
  if (!user) return null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background eco-mesh-bg flex items-center justify-center px-4">
        <motion.div className="text-center max-w-sm relative z-10" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 relative"
               style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.12), hsl(var(--eco-emerald) / 0.12))' }}>
            <CheckCircle className="w-12 h-12 text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/15" style={{ animation: 'pulse-ring 2.5s ease-in-out infinite' }} />
          </div>
          <h2 className="eco-heading mb-3">Week {nextWeek} Complete! 🎉</h2>
          <p className="text-muted-foreground mb-8 leading-relaxed">Great progress on your digital detox journey. Every GB deleted makes a difference.</p>
          <button onClick={() => navigate('/dashboard')} className="eco-btn-primary max-w-xs mx-auto">View Dashboard</button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background eco-hero-gradient pb-8">
      <div className="eco-container py-6 sm:py-8 relative z-10">
        <motion.header variants={fadeUp(0)} initial="hidden" animate="visible" className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="eco-icon-btn" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2.5">
              <h1 className="eco-page-title">Week {nextWeek}</h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15">Check-in</span>
            </div>
            <p className="text-sm text-muted-foreground/80 mt-0.5">Quick update — under 20 seconds!</p>
          </div>
        </motion.header>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hero input */}
          <motion.div variants={fadeUp(1)} initial="hidden" animate="visible"
            className="eco-card-elevated relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(var(--card) / 0.9), hsl(var(--card) / 0.95))' }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-eco-emerald/15 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <label className="text-base font-bold text-foreground">GB Deleted This Week</label>
                <p className="text-xs text-muted-foreground/70">Files, photos, emails removed</p>
              </div>
            </div>
            <input type="number" step="0.1" min="0" className="eco-input text-lg font-bold relative z-10" value={gbDeleted} onChange={e => setGbDeleted(e.target.value)} placeholder="0.0" required disabled={submitting} />
          </motion.div>

          {/* Screen Time */}
          <motion.div variants={fadeUp(2)} initial="hidden" animate="visible" className="eco-card">
            <div className="eco-section-header mb-4">
              <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-accent" />
              </div>
              <span>Screen Time</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="eco-label">Screen Time Change (hours)</label>
                <input type="number" step="0.1" className="eco-input" value={screenTimeChange} onChange={e => setScreenTimeChange(e.target.value)} placeholder="-1.5 (negative = reduced)" required disabled={submitting} />
                <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium">Negative = reduction from baseline</p>
              </div>
              <div>
                <label className="eco-label">Streaming Reduction (hours)</label>
                <input type="number" step="0.1" min="0" className="eco-input" value={streamingReduction} onChange={e => setStreamingReduction(e.target.value)} placeholder="3" required disabled={submitting} />
              </div>
            </div>
          </motion.div>

          {/* Alumni & Ritual */}
          <motion.div variants={fadeUp(3)} initial="hidden" animate="visible" className="eco-card">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                    <Users className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <label className="text-sm font-semibold text-foreground">Alumni Touchpoints</label>
                </div>
                <input type="number" min="0" className="eco-input" value={alumniTouchpoints} onChange={e => setAlumniTouchpoints(e.target.value)} placeholder="2" required disabled={submitting} />
                <p className="text-[11px] text-muted-foreground/60 mt-1.5 font-medium">Meaningful connections this week</p>
              </div>

              <div className="eco-divider" />

              <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 hover:border-border/50 transition-all duration-200">
                <input type="checkbox" checked={ritualCompleted} onChange={e => setRitualCompleted(e.target.checked)} className="eco-checkbox" disabled={submitting} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-accent" />
                    <span className="text-sm font-semibold text-foreground">Weekly Ritual Completed</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-medium">Did you complete your mindful practice?</p>
                </div>
              </label>
            </div>
          </motion.div>

          <motion.button variants={fadeUp(4)} initial="hidden" animate="visible" type="submit" className="eco-btn-primary flex items-center justify-center gap-2.5" disabled={submitting}>
            {submitting ? <><Spinner /> Submitting...</> : <><Send className="w-5 h-5" /> Submit Week {nextWeek}</>}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
