import React, { useState } from 'react';
import { apiRequest, setToken } from '../api';

export default function Auth({ onAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaPending, setMfaPending] = useState(false);
  const [mfaToken, setMfaToken] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });

      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
        setMfaPending(true);
      } else {
        setToken(data.token);
        onAuthenticated(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await apiRequest('/auth/mfa-verify', {
        method: 'POST',
        body: JSON.stringify({ mfaToken, code: mfaCode })
      });

      setToken(data.token);
      onAuthenticated(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setTimeout(() => {
      handleLoginDirect(presetEmail, presetPass);
    }, 50);
  };

  const handleLoginDirect = async (presetEmail, presetPass) => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: presetEmail, password: presetPass })
      });
      if (data.mfaRequired) {
        setMfaToken(data.mfaToken);
        setMfaPending(true);
      } else {
        setToken(data.token);
        onAuthenticated(data.user);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 min-h-screen bg-background">
      {!mfaPending ? (
        <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-primary"></div>
          
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-secondary text-2xl">fingerprint</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                LeakTrace <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-mono font-medium">React Edition</span>
              </h1>
              <p className="text-xs text-outline font-mono">FORENSIC WATERMARKING PORTAL</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-secondary text-xs font-mono mb-6 border border-outline-variant/50">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span>FIPS-140-3 Cryptographic Integrity</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Personnel Email</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">badge</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@leaktrace.internal"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">Security Passkey</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-lg">key</span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-surface-container border border-outline-variant rounded-lg pl-10 pr-3 py-2 text-sm text-white placeholder-outline focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-container text-error text-xs flex items-center gap-2 border border-error/30 font-mono">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>{loading ? 'Authenticating...' : 'Authenticate Session'}</span>
            </button>
          </form>

          {/* Quick Credential Switcher */}
          <div className="mt-6 pt-6 border-t border-outline-variant/40">
            <p className="text-xs text-outline mb-2.5 font-mono uppercase tracking-wider">Quick Credential Presets:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPreset('admin@leaktrace.internal', 'Password123!')}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-left transition-colors"
              >
                <div className="font-medium text-primary">Fahim (Admin)</div>
                <div className="text-[10px] text-outline truncate">ID: 24524203055</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset('abid@leaktrace.internal', 'Password123!')}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-left transition-colors"
              >
                <div className="font-medium text-secondary">Abid (Agent)</div>
                <div className="text-[10px] text-outline truncate">ID: 24524203133</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset('hojaifa@leaktrace.internal', 'Password123!')}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-left transition-colors"
              >
                <div className="font-medium text-secondary">Hojaifa (Agent)</div>
                <div className="text-[10px] text-outline truncate">ID: 24524203181</div>
              </button>
              <button
                type="button"
                onClick={() => setPreset('member@leaktrace.internal', 'Password123!')}
                className="p-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-left transition-colors"
              >
                <div className="font-medium text-secondary">Member (Agent)</div>
                <div className="text-[10px] text-outline truncate">ID: 24524203023</div>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-surface-container-low border border-outline-variant rounded-2xl p-8 shadow-2xl relative">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center border border-outline-variant">
              <span className="material-symbols-outlined text-warning text-2xl">security</span>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">MFA Challenge</h2>
              <p className="text-xs text-outline font-mono">ENCLAVE MULTI-FACTOR VERIFICATION</p>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant mb-6">
            Administrator access requires hardware enclave MFA verification. Enter the 6-digit challenge code to proceed.
          </p>

          <form onSubmit={handleMfaVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-on-surface-variant mb-1">6-Digit Security Token</label>
              <input
                type="text"
                maxLength={6}
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="123456"
                className="w-full bg-surface-container border border-outline-variant rounded-lg px-4 py-2 text-center text-xl font-mono tracking-widest text-secondary placeholder-outline focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
              <p className="text-[11px] text-outline mt-1 font-mono">
                Demo token: <span className="text-secondary font-bold">123456</span>
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-error-container text-error text-xs flex items-center gap-2 border border-error/30 font-mono">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-secondary hover:bg-secondary/90 text-on-secondary font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">verified</span>
              <span>{loading ? 'Verifying...' : 'Verify & Unlock Console'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMfaPending(false);
                setMfaToken(null);
              }}
              className="w-full py-2 px-4 rounded-lg bg-transparent hover:bg-surface-container text-on-surface-variant text-xs transition-colors"
            >
              Return to Sign In
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

