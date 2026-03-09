import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Leaf, Eye, EyeOff, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } }),
};

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function LoginPage() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [cohort, setCohort] = useState('');
  const [consent, setConsent] = useState(false);
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user) { setError('Invalid email or password'); return; }
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!consent) { setError('You must agree to the data processing terms'); return; }
    if (!name || !regEmail || !regPassword || !country || !city) { setError('Please fill in all required fields'); return; }
    setLoading(true);
    try {
      await register({ name, email: regEmail, password: regPassword, country, city, cohort, consentGiven: consent });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-background">
      {/* Animated mesh background */}
      <div className="eco-mesh-bg absolute inset-0" />
      
      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" style={{ animation: 'float 8s ease-in-out infinite' }} />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-eco-emerald/5 rounded-full blur-3xl" style={{ animation: 'float 10s ease-in-out infinite reverse' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/3 rounded-full blur-3xl" />

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:py-12 relative z-10">
        <div className="w-full max-w-[400px]">
          {/* Logo */}
          <motion.div 
            className="flex flex-col items-center mb-10"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="relative mb-5">
              <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-[22px] flex items-center justify-center relative"
                   style={{ background: 'linear-gradient(135deg, hsl(var(--eco-gradient-start)), hsl(var(--eco-gradient-end)))', boxShadow: 'var(--shadow-glow-lg)' }}>
                <Leaf className="w-9 h-9 sm:w-10 sm:h-10 text-primary-foreground drop-shadow-sm" />
              </div>
              <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-accent flex items-center justify-center shadow-lg ring-4 ring-background">
                <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-[22px] border-2 border-primary/20" style={{ animation: 'pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            </div>
            <h1 className="eco-heading text-center">Digital Detox</h1>
            <p className="eco-subheading mt-1.5 text-center">CIC Challenge Tracker</p>
          </motion.div>

          {/* Card */}
          <motion.div 
            className="eco-glass-strong rounded-3xl p-6 sm:p-8"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{ boxShadow: 'var(--shadow-2xl)' }}
          >
            <AnimatePresence mode="wait">
              {!isRegister ? (
                <motion.form 
                  key="login" 
                  onSubmit={handleLogin} 
                  className="space-y-5"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-4">
                    <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
                      <label className="eco-label">Email</label>
                      <input type="email" className="eco-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@insead.edu" required disabled={loading} autoComplete="email" />
                    </motion.div>
                    <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
                      <label className="eco-label">Password</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} className="eco-input pr-12" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} autoComplete="current-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </motion.div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/15">
                        <p className="text-sm text-destructive font-medium">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button custom={2} variants={fadeUp} initial="hidden" animate="visible" type="submit" className="eco-btn-primary flex items-center justify-center gap-2.5" disabled={loading}>
                    {loading ? <><Spinner /> Signing in...</> : <>Sign In <ArrowRight className="w-4.5 h-4.5" /></>}
                  </motion.button>

                  <div className="eco-divider" />

                  <p className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => { setIsRegister(true); setError(''); }} className="text-primary font-semibold hover:underline underline-offset-4">
                      Create one
                    </button>
                  </p>
                </motion.form>
              ) : (
                <motion.form 
                  key="register" 
                  onSubmit={handleRegister} 
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-3.5">
                    <div>
                      <label className="eco-label">Full Name *</label>
                      <input className="eco-input" value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required disabled={loading} autoComplete="name" />
                    </div>
                    <div>
                      <label className="eco-label">Email *</label>
                      <input type="email" className="eco-input" value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="you@insead.edu" required disabled={loading} autoComplete="email" />
                    </div>
                    <div>
                      <label className="eco-label">Password *</label>
                      <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} className="eco-input pr-12" value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Min 6 characters" required disabled={loading} autoComplete="new-password" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
                          {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="eco-label">Country *</label>
                        <input className="eco-input" value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" required disabled={loading} />
                      </div>
                      <div>
                        <label className="eco-label">City *</label>
                        <input className="eco-input" value={city} onChange={e => setCity(e.target.value)} placeholder="City" required disabled={loading} />
                      </div>
                    </div>
                    <div>
                      <label className="eco-label">INSEAD Cohort <span className="text-muted-foreground/60 font-normal">(optional)</span></label>
                      <input className="eco-input" value={cohort} onChange={e => setCohort(e.target.value)} placeholder="e.g. MBA 22J" disabled={loading} />
                    </div>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-all">
                    <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="eco-checkbox mt-0.5" disabled={loading} />
                    <span className="text-xs text-muted-foreground leading-relaxed">
                      <Shield className="w-3.5 h-3.5 inline mr-1 text-primary/60" />
                      I consent to the processing of my data for the Digital Detox Challenge (GDPR compliant). Data will be used only for challenge tracking and aggregated reporting.
                    </span>
                  </label>

                  <AnimatePresence>
                    {error && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="px-4 py-3 rounded-xl bg-destructive/8 border border-destructive/15">
                        <p className="text-sm text-destructive font-medium">{error}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button type="submit" className="eco-btn-primary flex items-center justify-center gap-2.5" disabled={loading}>
                    {loading ? <><Spinner /> Creating account...</> : <>Create Account <ArrowRight className="w-4.5 h-4.5" /></>}
                  </button>

                  <div className="eco-divider" />

                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <button type="button" onClick={() => { setIsRegister(false); setError(''); }} className="text-primary font-semibold hover:underline underline-offset-4">
                      Sign in
                    </button>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-5 text-center relative z-10">
        <p className="text-xs text-muted-foreground/60">
          CIC Digital Detox Challenge © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
