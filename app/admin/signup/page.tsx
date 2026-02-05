'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react';

export default function SignupPage() {
    const [name, setName] = useState('');
    const [contactPersonName, setContactPersonName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);

        try {
            const response = await axios.post('/api/auth/connect', {
                name,
                contactPersonName,
                email,
                phone
            });

            if (response.data.success) {
                setSuccess(true);
                setName('');
                setContactPersonName('');
                setEmail('');
                setPhone('');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 py-12">
            <div className="w-full max-w-lg bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
                <h1 className="text-3xl font-bold text-center mb-2 text-amber-500">TheLeadSpin – Get Started Free</h1>
                <p className="text-sm text-slate-400 text-center mb-8">
                    Create your campaign engine in seconds.
                </p>

                {success && (
                    <div className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-3 rounded-lg mb-6 text-sm">
                        Thank you! We will connect with you soon.
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Business Name *</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                            placeholder="TheLeadSpin"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Contact Person Name *</label>
                        <input
                            type="text"
                            value={contactPersonName}
                            onChange={(e) => setContactPersonName(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                            placeholder="Full name of contact person"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Email Address *</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all font-medium"
                            placeholder="you@company.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Phone Number *</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                            placeholder="+91 98765 43210"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg disabled:opacity-50 mt-4 active:scale-95"
                    >
                        {loading ? 'Sending...' : 'Connect with us'}
                    </button>
                </form>

                <p className="mt-8 text-center text-slate-500 text-sm">
                    Already have an account?{' '}
                    <a href="/admin" className="text-amber-500 hover:text-amber-400 font-semibold transition-colors">
                        Sign In here
                    </a>
                </p>

                <p className="mt-6 text-center text-slate-600 text-[10px] leading-relaxed">
                    By submitting, you agree to our Terms of Service and Privacy Policy. Powered by TheLeadSpin.
                </p>
            </div>
        </div>
    );
}
