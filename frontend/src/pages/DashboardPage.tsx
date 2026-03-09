import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { baselineApi, weeklyApi, adminApi, type BaselineData, type WeeklySubmission, type AdminConfig } from '@/lib/api';
import { NavLink as RouterNavLink, useNavigate } from 'react-router-dom';
import { Leaf, BarChart3, Zap, Users, LogOut, Plus, TrendingDown, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 ${
          isActive
            ? 'text-primary bg-primary/8 shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`
      }
    >
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
    </RouterNavLink>
  );
}

export default function DashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [baseline, setBaseline] = useState<BaselineData | null>(null);
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { navigate('/', { replace: true }); return; }
    if (user) loadData();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [b, s, c] = await Promise.all([
        baselineApi.getBaseline(user.user_id),
        weeklyApi.getSubmissions(user.user_id),
        adminApi.getConfig(),
      ]);
      setBaseline(b); setSubmissions(s); setConfig(c);
    } catch (e) { console.error('Error loading data:', e); }
    finally { setLoading(false); }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </motion.div>
      </div>
    );
  }

  if (!user) return null;

  const totalGBDeleted = submissions.reduce((s, w) => s + Number(w.gb_deleted), 0);
  const co2Multiplier = config?.co2_multiplier_per_gb || 0.02;
  const co2Avoided = totalGBDeleted * Number(co2Multiplier);
  const totalScreenTimeChange = submissions.reduce((s, w) => s + Number(w.screen_time_change), 0);
  const weeksCompleted = submissions.length;
  const totalWeeks = 8;
  const challengeProgress = Math.min((weeksCompleted / totalWeeks) * 100, 100);

  const metrics = [
    { icon: Zap, value: totalGBDeleted.toFixed(1), label: 'GB Deleted', color: 'from-primary/15 to-eco-emerald/15' },
    { icon: Leaf, value: co2Avoided.toFixed(2), label: 'kg CO₂ Avoided', color: 'from-eco-emerald/15 to-eco-glow/15' },
    { icon: TrendingDown, value: `${totalScreenTimeChange > 0 ? '+' : ''}${totalScreenTimeChange.toFixed(1)}`, label: 'Screen Time (hrs)', color: 'from-accent/10 to-eco-warm/10' },
    { icon: Users, value: submissions.reduce((s, w) => s + w.alumni_touchpoints, 0).toString(), label: 'Alumni Connects', color: 'from-primary/10 to-accent/10' },
  ];

  return (
    <div className="min-h-screen bg-background eco-hero-gradient pb-28">
      <div className="eco-container py-6 sm:py-8 relative z-10">
        {/* Header */}
        <motion.header custom={0} variants={cardVariants} initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
          <div>
            <p className="text-sm text-muted-foreground/80 font-medium">Welcome back,</p>
            <h1 className="eco-page-title mt-0.5">{user.name?.split(' ')[0]} 👋</h1>
          </div>
          <button onClick={async () => { await logout(); navigate('/'); }} className="eco-icon-btn" aria-label="Logout">
            <LogOut className="w-5 h-5" />
          </button>
        </motion.header>

        {/* Baseline prompt */}
        {!baseline && (
          <motion.div custom={1} variants={cardVariants} initial="hidden" animate="visible"
            className="mb-6 rounded-2xl p-5 border border-primary/20 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.06), hsl(var(--eco-emerald) / 0.04))' }}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">Complete Your Baseline</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Set your digital starting point</p>
              </div>
              <button onClick={() => navigate('/baseline')} className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shadow-lg" style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Progress Card */}
        <motion.div custom={2} variants={cardVariants} initial="hidden" animate="visible" className="eco-card mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-foreground">Challenge Progress</h3>
              <p className="text-sm text-muted-foreground/80 mt-0.5">8-week digital detox journey</p>
            </div>
            <div className="px-3 py-1.5 rounded-full text-xs font-bold bg-primary/8 text-primary border border-primary/15">
              Week {weeksCompleted}/{totalWeeks}
            </div>
          </div>
          <div className="eco-progress">
            <div className="eco-progress-bar" style={{ width: `${challengeProgress}%` }} />
          </div>
          <p className="text-xs text-muted-foreground/70 text-right mt-2 font-medium">{challengeProgress.toFixed(0)}% complete</p>
        </motion.div>

        {/* Key metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {metrics.map((m, i) => (
            <motion.div key={m.label} custom={i + 3} variants={cardVariants} initial="hidden" animate="visible"
              className="eco-metric-card group"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.color} flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110`}>
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="eco-stat-value">{m.value}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 font-medium">{m.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Recent submissions */}
        {submissions.length > 0 && (
          <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible" className="eco-card mb-6">
            <div className="eco-section-header">
              <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-primary" />
              </div>
              <span>Recent Submissions</span>
            </div>
            <div className="space-y-2">
              {submissions.slice(-3).reverse().map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/40 transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center">
                      <span className="text-sm font-extrabold text-primary">{s.week_number}</span>
                    </div>
                    <span className="text-sm font-semibold text-foreground">Week {s.week_number}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-eco-metric">{Number(s.gb_deleted).toFixed(1)} GB</span>
                    {s.ritual_completed ? (
                      <span className="eco-badge-success text-[10px]">✓ Ritual</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/50">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        {baseline && (
          <motion.button
            custom={8} variants={cardVariants} initial="hidden" animate="visible"
            onClick={() => navigate('/weekly')}
            className="eco-btn-primary flex items-center justify-center gap-2.5"
          >
            <Plus className="w-5 h-5" />
            Submit Weekly Check-in
          </motion.button>
        )}
      </div>

      {/* Bottom navigation */}
      <nav className="eco-bottom-nav">
        <div className="eco-container flex justify-around py-1">
          <NavItem to="/dashboard" icon={<BarChart3 className="w-5 h-5" />} label="Dashboard" />
          <NavItem to="/baseline" icon={<Sparkles className="w-5 h-5" />} label="Baseline" />
          <NavItem to="/weekly" icon={<Leaf className="w-5 h-5" />} label="Weekly" />
        </div>
      </nav>
    </div>
  );
}
