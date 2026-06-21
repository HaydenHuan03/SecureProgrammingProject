import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuth } from '../hooks/useAuth';
import InputField from '../hooks/InputField';

type Step = 'credentials' | 'otp';

export default function LoginPage() {
  const navigate      = useNavigate();
  const { setUser }   = useAuth();

  const [step, setStep]       = useState<Step>('credentials');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp]         = useState('');
  const [error, setError]     = useState('');
  const [info, setInfo]       = useState('');
  const [loading, setLoading] = useState(false);

  // ── Step 1: submit credentials ────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.login({ email, password });
      setInfo(res.data.message);
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify OTP ───────────────────────────────────────────────────
  const handleOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.verifyOTP({ email, code: otp });
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">{step === 'otp' ? '📧' : '🔐'}</div>
          <h1 className="auth-title">
            {step === 'otp' ? 'Check Your Email' : 'Welcome Back'}
          </h1>
          <p className="auth-subtitle">
            {step === 'otp'
              ? `OTP sent to ${email}`
              : 'SECR4483 Secure App'}
          </p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {info  && <div className="alert alert-info">{info}</div>}

        {/* Step 1 – Credentials */}
        {step === 'credentials' && (
          <form onSubmit={handleCredentials} noValidate>
            <InputField
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
            <InputField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              placeholder="Your password"
              autoComplete="current-password"
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Continue →'}
            </button>
          </form>
        )}

        {/* Step 2 – OTP */}
        {step === 'otp' && (
          <form onSubmit={handleOTP} noValidate>
            <InputField
              label="6-Digit OTP Code"
              name="otp"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="______"
              autoComplete="one-time-code"
              required
            />
            <p className="otp-hint">Code expires in 5 minutes. Check your spam folder if needed.</p>

            <button type="submit" className="btn-primary" disabled={loading || otp.length !== 6}>
              {loading ? <span className="spinner" /> : 'Verify & Sign In'}
            </button>

            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setStep('credentials'); setOtp(''); setError(''); setInfo(''); }}
            >
              ← Back
            </button>
          </form>
        )}

        {step === 'credentials' && (
          <p className="auth-footer">
            No account?{' '}
            <Link to="/register" className="auth-link">Create one</Link>
          </p>
        )}
      </div>
    </div>
  );
}