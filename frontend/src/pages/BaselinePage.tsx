import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { baselineApi, type BaselineData } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Laptop, Cloud, Mail, Clock, Tv, ArrowLeft, CheckCircle, Sparkles } from 'lucide-react';
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

export default function BaselinePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [existing, setExisting] = useState<BaselineData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [phoneStorage, setPhoneStorage] = useState('');
  const [laptopStorage, setLaptopStorage] = useState('');
  const [cloudStorage, setCloudStorage] = useState('');
  const [mailboxSize, setMailboxSize] = useState('');
  const [screenTime, setScreenTime] = useState('');
  const [streamingTime, setStreamingTime] = useState('');

  useEffect(() => {
    if (!authLoading && !user) { navigate('/', { replace: true }); return; }
    if (user) loadBaseline();
  }, [user, authLoading, navigate]);

  const loadBaseline = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await baselineApi.getBaseline(user.user_id);
      if (data) {
        setExisting(data);
        setPhoneStorage(String(data.phone_storage_gb));
        setLaptopStorage(String(data.laptop_storage_gb));
        setCloudStorage(String(data.cloud_storage_gb));
        setMailboxSize(String(data.mailbox_size_gb));
        setScreenTime(String(data.avg_screen_time_hours));
        setStreamingTime(String(data.streaming_hours_week));
      }
    } catch (e) { console.error('Error loading baseline:', e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      await baselineApi.submitBaseline({
        user_id: user.user_id,
        phone_storage_gb: Number(phoneStorage) || 0,
        laptop_storage_gb: Number(laptopStorage) || 0,
        cloud_storage_gb: Number(cloudStorage) || 0,
        mailbox_size_gb: Number(mailboxSize) || 0,
        avg_screen_time_hours: Number(screenTime) || 0,
        streaming_hours_week: Number(streamingTime) || 0,
      });
      navigate('/dashboard');
    } catch (e) { console.error('Error submitting baseline:', e); }
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

  const inputFields = [
    { key: 'phone', label: 'Phone Storage', value: phoneStorage, setter: setPhoneStorage, icon: Smartphone, placeholder: '48', unit: 'GB' },
    { key: 'laptop', label: 'Laptop Storage', value: laptopStorage, setter: setLaptopStorage, icon: Laptop, placeholder: '200', unit: 'GB' },
    { key: 'cloud', label: 'Cloud Storage', value: cloudStorage, setter: setCloudStorage, icon: Cloud, placeholder: '80', unit: 'GB' },
    { key: 'mailbox', label: 'Mailbox Size', value: mailboxSize, setter: setMailboxSize, icon: Mail, placeholder: '12', unit: 'GB' },
  ];
  const timeFields = [
    { key: 'screen', label: 'Avg Screen Time', value: screenTime, setter: setScreenTime, icon: Clock, placeholder: '6.5', unit: 'hrs/day' },
    { key: 'streaming', label: 'Streaming Time', value: streamingTime, setter: setStreamingTime, icon: Tv, placeholder: '14', unit: 'hrs/week' },
  ];

  return (
    <div className="min-h-screen bg-background eco-hero-gradient pb-8">
      <div className="eco-container py-6 sm:py-8 relative z-10">
        <motion.header variants={fadeUp(0)} initial="hidden" animate="visible" className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate('/dashboard')} className="eco-icon-btn" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="eco-page-title">Baseline Assessment</h1>
            <p className="text-sm text-muted-foreground/80 mt-0.5">Your digital starting point</p>
          </div>
        </motion.header>

        {existing && (
          <motion.div variants={fadeUp(1)} initial="hidden" animate="visible"
            className="mb-6 rounded-2xl p-4 border border-eco-success/20 relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, hsl(var(--eco-success) / 0.06), transparent)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-eco-success/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-eco-success" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Baseline Completed</p>
                <p className="text-xs text-muted-foreground">
                  Submitted {new Date(existing.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div variants={fadeUp(2)} initial="hidden" animate="visible">
            <div className="eco-section-header mb-4">
              <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span>Storage Usage</span>
            </div>
            <div className="eco-card">
              <div className="grid gap-5">
                {inputFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/10 to-eco-emerald/10 flex items-center justify-center flex-shrink-0">
                      <field.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-sm font-semibold text-foreground">{field.label}</label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input type="number" step="0.1" min="0" className="eco-input py-2.5" value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} required disabled={submitting} />
                        <span className="text-xs text-muted-foreground font-semibold w-10 flex-shrink-0">{field.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div variants={fadeUp(3)} initial="hidden" animate="visible">
            <div className="eco-section-header mb-4">
              <div className="w-6 h-6 rounded-lg bg-primary/8 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-primary" />
              </div>
              <span>Screen Time</span>
            </div>
            <div className="eco-card">
              <div className="grid gap-5">
                {timeFields.map((field) => (
                  <div key={field.key} className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-accent/10 to-eco-warm/10 flex items-center justify-center flex-shrink-0">
                      <field.icon className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <label className="text-sm font-semibold text-foreground">{field.label}</label>
                      <div className="flex items-center gap-2 mt-1.5">
                        <input type="number" step="0.1" min="0" className="eco-input py-2.5" value={field.value} onChange={e => field.setter(e.target.value)} placeholder={field.placeholder} required disabled={submitting} />
                        <span className="text-xs text-muted-foreground font-semibold w-14 flex-shrink-0">{field.unit}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.button variants={fadeUp(4)} initial="hidden" animate="visible" type="submit" className="eco-btn-primary flex items-center justify-center gap-2" disabled={submitting}>
            {submitting ? <><Spinner /> Saving...</> : existing ? 'Update Baseline' : 'Save Baseline'}
          </motion.button>
        </form>
      </div>
    </div>
  );
}
