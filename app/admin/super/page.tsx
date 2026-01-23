'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function SuperAdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/admin/login', { email, password });
            
            // Debug logging (remove in production)
            console.log('Login response:', {
                success: response.data.success,
                isSuperAdmin: response.data.admin?.isSuperAdmin,
                admin: response.data.admin
            });
            
            if (response.data.success) {
                // Check if it's a Super Admin
                if (response.data.admin?.isSuperAdmin === true) {
                    localStorage.setItem('super-admin-token', response.data.token);
                    localStorage.setItem('super-admin-data', JSON.stringify(response.data.admin));
                    router.push('/admin/super/dashboard');
                } else {
                    setError(`Access denied. Super Admin credentials required. (Logged in as: ${response.data.admin?.name || 'Unknown'})`);
                }
            } else {
                setError('Access denied. Super Admin credentials required.');
            }
        } catch (err: any) {
            const errorMessage = err.response?.data?.error || err.message || 'Login failed';
            setError(errorMessage);
            // Log error details for debugging (only if meaningful error exists)
            if (err.response?.data?.error || err.message) {
                console.error('Login error:', err.response?.data?.error || err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
                        👑
                    </div>
                    <h1 className="text-2xl font-bold text-amber-500">Super Admin Portal</h1>
                    <p className="text-slate-400 text-sm mt-2">Platform Management Access</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            placeholder="offer@admin.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
                    >
                        {loading ? 'Authenticating...' : 'Sign In as Super Admin'}
                    </button>
                </form>

                <div className="mt-6 space-y-2">
                    <div className="text-center">
                        <a href="/admin" className="text-slate-500 hover:text-slate-400 text-sm">
                            Tenant Admin Login →
                        </a>
                    </div>
                    <div className="text-center text-xs text-slate-600 pt-2 border-t border-slate-800">
                        <p className="mb-1">Default Credentials:</p>
                        <p className="font-mono">offer@admin.com / admin123</p>
                        <p className="text-[10px] text-slate-500 mt-1 italic">(or super@admin.com if ADMIN_EMAIL not set)</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
