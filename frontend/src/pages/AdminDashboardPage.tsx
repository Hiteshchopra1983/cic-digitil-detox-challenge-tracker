import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { profileApi, weeklyApi, adminApi, type Profile, type WeeklySubmission, type AdminConfig } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Download, LogOut, Settings, Users, Leaf, Zap, Globe, GraduationCap, Trophy, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function AdminDashboardPage() {
  const { user, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [participants, setParticipants] = useState<Profile[]>([]);
  const [submissions, setSubmissions] = useState<WeeklySubmission[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [co2Input, setCo2Input] = useState('0.02');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) { navigate('/', { replace: true }); return; }
    if (user && user.role === 'admin') loadData();
  }, [user, authLoading, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [c, p, s] = await Promise.all([adminApi.getConfig(), profileApi.getParticipants(), weeklyApi.getAllSubmissions()]);
      setConfig(c); setCo2Input(String(c?.co2_multiplier_per_gb || 0.02)); setParticipants(p); setSubmissions(s);
    } catch (e) { console.error('Error loading admin data:', e); }
    finally { setLoading(false); }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await adminApi.updateConfig(Number(co2Input));
      setConfig(prev => prev ? { ...prev, co2_multiplier_per_gb: Number(co2Input) } : null);
      setShowSettings(false);
    } catch (e) { console.error('Error saving config:', e); }
    finally { setSaving(false); }
  };

  const exportCSV = async () => {
    if (!config) return;
    const csv = await adminApi.exportCSV(participants, submissions, config);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `cic_detox_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div className="flex flex-col items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">Loading dashboard...</p>
        </motion.div>
      </div>
    );
  }
  if (!user || user.role !== 'admin') return null;

  const co2Multiplier = Number(config?.co2_multiplier_per_gb || 0.02);
  const totalGBDeleted = submissions.reduce((s, w) => s + Number(w.gb_deleted), 0);
  const totalCO2 = totalGBDeleted * co2Multiplier;
  const participantsWithSubmissions = new Set(submissions.map(s => s.user_id)).size;
  const participationRate = participants.length > 0 ? ((participantsWithSubmissions / participants.length) * 100) : 0;

  const countryMap: Record<string, number> = {};
  participants.forEach(p => { countryMap[p.country] = (countryMap[p.country] || 0) + 1; });
  const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const cohortMap: Record<string, number> = {};
  participants.forEach(p => { if (p.cohort) cohortMap[p.cohort] = (cohortMap[p.cohort] || 0) + 1; });
  const topCohorts = Object.entries(cohortMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const gbByParticipant: Record<string, number> = {};
  submissions.forEach(s => { gbByParticipant[s.user_id] = (gbByParticipant[s.user_id] || 0) + Number(s.gb_deleted); });
  const leaderboard = Object.entries(gbByParticipant)
    .map(([userId, gb]) => ({ name: participants.find(p => p.user_id === userId)?.name || 'Unknown', gb }))
    .sort((a, b) => b.gb - a.gb).slice(0, 5);
  const medals = ['🥇', '🥈', '🥉'];

  const metricCards = [
    { icon: Users, value: participants.length.toString(), label: 'Participants', gradient: 'from-primary/12 to-eco-emerald/12' },
    { icon: Zap, value: totalGBDeleted.toFixed(1), label: 'Total GB Deleted', gradient: 'from-eco-emerald/12 to-eco-glow/12' },
    { icon: Leaf, value: totalCO2.toFixed(2), label: 'kg CO₂ Avoided', gradient: 'from-primary/10 to-accent/10' },
    { icon: Activity, value: `${participationRate.toFixed(0)}%`, label: 'Participation', gradient: 'from-accent/10 to-eco-warm/10' },
  ];

  return (
    <div className="min-h-screen bg-background eco-hero-gradient pb-8">
      <div className="eco-container py-6 sm:py-8 relative z-10">
        {/* Header */}
        <motion.header custom={0} variants={cardVariants} initial="hidden" animate="visible" className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-eco-success animate-pulse" />
              <p className="text-xs text-muted-foreground/70 font-semibold uppercase tracking-wider">Admin Panel</p>
            </div>
            <h1 className="eco-page-title">Challenge Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowSettings(!showSettings)} className={`eco-icon-btn ${showSettings ? 'bg-primary text-primary-foreground border-primary/50' : ''}`} aria-label="Settings">
              <Settings className="w-5 h-5" />
            </button>
            <button onClick={async () => { await logout(); navigate('/'); }} className="eco-icon-btn" aria-label="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </motion.header>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: 'auto', marginBottom: 24 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="eco-card-elevated">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-foreground">CO₂ Configuration</h3>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="eco-label">kg CO₂ per GB deleted</label>
                    <input type="number" step="0.001" min="0" className="eco-input" value={co2Input} onChange={e => setCo2Input(e.target.value)} />
                  </div>
                  <button onClick={saveConfig} className="eco-btn-primary w-auto px-6 self-end !py-3.5" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          {metricCards.map((m, i) => (
            <motion.div key={m.label} custom={i + 1} variants={cardVariants} initial="hidden" animate="visible" className="eco-metric-card group">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${m.gradient} flex items-center justify-center mx-auto mb-3 transition-transform duration-300 group-hover:scale-110`}>
                <m.icon className="w-5 h-5 text-primary" />
              </div>
              <p className="eco-stat-value">{m.value}</p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-1.5 font-medium">{m.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible" className="eco-card mb-6">
            <div className="eco-section-header">
              <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center">
                <Trophy className="w-3.5 h-3.5 text-accent" />
              </div>
              <span>Top Contributors</span>
            </div>
            <div className="space-y-1.5">
              {leaderboard.map((entry, i) => (
                <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-200 ${
                  i === 0 ? 'bg-gradient-to-r from-accent/8 to-transparent border border-accent/10' : 'hover:bg-muted/30'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-extrabold ${
                      i < 3 ? 'bg-gradient-to-br from-accent/15 to-eco-warm/15' : 'bg-muted/50'
                    }`}>
                      {i < 3 ? medals[i] : <span className="text-muted-foreground text-xs">{i + 1}</span>}
                    </div>
                    <span className="text-sm font-semibold text-foreground">{entry.name}</span>
                  </div>
                  <span className="text-sm font-bold text-eco-metric">{entry.gb.toFixed(1)} GB</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Breakdowns */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {topCountries.length > 0 && (
            <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible" className="eco-card">
              <div className="eco-section-header">
                <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>By Country</span>
              </div>
              <div className="space-y-3">
                {topCountries.map(([country, count]) => (
                  <div key={country} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{country}</span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(count / participants.length) * 100}%`, background: 'linear-gradient(90deg, hsl(var(--eco-gradient-start)), hsl(var(--eco-gradient-end)))' }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {topCohorts.length > 0 && (
            <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible" className="eco-card">
              <div className="eco-section-header">
                <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                </div>
                <span>By Cohort</span>
              </div>
              <div className="space-y-3">
                {topCohorts.map(([cohort, count]) => (
                  <div key={cohort} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{cohort}</span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 h-2 bg-muted/50 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(count / participants.length) * 100}%`, background: 'linear-gradient(90deg, hsl(var(--eco-gradient-start)), hsl(var(--eco-gradient-end)))' }} />
                      </div>
                      <span className="text-xs text-muted-foreground font-semibold w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Export */}
        <motion.button custom={8} variants={cardVariants} initial="hidden" animate="visible"
          onClick={exportCSV}
          className="eco-btn-secondary flex items-center justify-center gap-2.5"
        >
          <Download className="w-5 h-5" />
          Export CSV Report
        </motion.button>
      </div>
    </div>
  );
}
