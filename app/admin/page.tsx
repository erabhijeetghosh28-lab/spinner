'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
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
            if (response.data.success) {
                // Prevent Super Admins from logging in through tenant admin login
                if (response.data.admin?.isSuperAdmin === true) {
                    setError('Super Admin accounts must use the Super Admin login page at /admin/super');
                    return;
                }

                // Ensure this is a tenant admin (has tenantId)
                if (!response.data.tenantId) {
                    setError('Invalid credentials. Tenant admin access required.');
                    return;
                }

                localStorage.setItem('admin-token', response.data.token);
                // Store admin data
                if (response.data.admin) {
                    localStorage.setItem('admin-data', JSON.stringify(response.data.admin));
                }
                // Store tenant context for tenant admins
                localStorage.setItem('admin-tenant-id', response.data.tenantId);
                localStorage.setItem('admin-tenant-data', JSON.stringify(response.data.tenant));
                
                router.push('/admin/dashboard');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <h1 className="text-2xl font-bold text-center mb-2 text-amber-500">Tenant Admin Login</h1>
                <p className="text-xs text-slate-400 text-center mb-8">
                    For Super Admin access, use <a href="/admin/super" className="text-amber-500 hover:underline font-semibold">/admin/super</a>
                </p>

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
                            placeholder="admin@example.com"
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
                        {loading ? 'Authenticating...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
}
