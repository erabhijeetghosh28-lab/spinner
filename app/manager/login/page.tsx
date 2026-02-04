'use client';

import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, useEffect } from 'react';

function ManagerLoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [managerId, setManagerId] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pre-fill manager ID from URL parameter
  useEffect(() => {
    const idFromUrl = searchParams.get('id');
    if (idFromUrl) {
      setManagerId(idFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Use manager ID from URL if available, otherwise from input
    const finalManagerId = searchParams.get('id') || managerId.trim();

    if (!finalManagerId) {
      setError('Manager ID is required');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/manager/auth/login', {
        managerId: finalManagerId,
        pin: pin.trim()
      });

      // Store token and manager data
      localStorage.setItem('manager-token', response.data.token);
      localStorage.setItem('manager-data', JSON.stringify(response.data.manager));

      // Redirect to dashboard
      router.push('/manager/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Manager Portal</h1>
          <p className="text-slate-400 text-sm">Sign in to grant spins to customers</p>
        </div>

        {/* Login Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Manager ID Field - Hidden if provided in URL */}
            {!searchParams.get('id') && (
              <div>
                <label htmlFor="managerId" className="block text-sm font-medium text-slate-300 mb-2">
                  Manager ID
                </label>
                <input
                  id="managerId"
                  type="text"
                  value={managerId}
                  onChange={(e) => setManagerId(e.target.value)}
                  required
                  placeholder="Enter your manager ID"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
                />
              </div>
            )}
            {searchParams.get('id') && (
              <div className="p-3 bg-slate-800/50 border border-slate-700 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Manager ID</p>
                <p className="text-sm text-slate-300 font-mono">{searchParams.get('id')}</p>
              </div>
            )}

            {/* PIN Field */}
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-slate-300 mb-2">
                PIN
              </label>
              <input
                id="pin"
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, ''); // Only digits
                  if (value.length <= 4) setPin(value);
                }}
                required
                placeholder="Enter 4-digit PIN"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all text-center text-2xl tracking-widest"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-slate-500 text-xs text-center">
              Your Manager ID and PIN were provided by your tenant administrator.
              <br />
              Contact your admin if you need assistance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Manager Portal</h1>
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl animate-pulse h-80" />
      </div>
    </div>
  );
}

export default function ManagerLogin() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <ManagerLoginForm />
    </Suspense>
  );
}
