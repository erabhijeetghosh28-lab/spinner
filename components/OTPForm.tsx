'use client';

import React, { useState } from 'react';

interface OTPFormProps {
    onVerify: (phone: string, otp: string, name?: string) => Promise<void>;
    onSendOTP: (phone: string) => Promise<boolean>;
}

const OTPForm: React.FC<OTPFormProps> = ({ onVerify, onSendOTP }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '']);
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Please enter your name');
            return;
        }
        if (phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setLoading(true);
        setError('');

        const success = await onSendOTP(phone);
        if (success) {
            setStep('otp');
        } else {
            setError('Failed to send OTP. Please try again.');
        }
        setLoading(false);
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const otpCode = otp.join('');
        if (otpCode.length < 4) {
            setError('Please enter all 4 digits');
            return;
        }

        setLoading(true);
        setError('');
        
        try {
            await onVerify(phone, otpCode, name.trim());
            // If verification succeeds, the parent component will update state and hide this form
        } catch (err: any) {
            setError(err.response?.data?.error || 'OTP verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpChange = (index: number, value: string) => {
        if (isNaN(Number(value))) return;

        const newOtp = [...otp];
        newOtp[index] = value.substring(value.length - 1);
        setOtp(newOtp);

        // Auto focus next input
        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            nextInput?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            prevInput?.focus();
        }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            {step === 'phone' ? (
                <form onSubmit={handleSendOTP} className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Your Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Full Name"
                            className="w-full px-5 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder:text-slate-600"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest ml-1">WhatsApp Number</label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-5 pointer-events-none border-r border-slate-700/50 pr-3">
                                <span className="text-slate-500 font-bold text-sm">+91</span>
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                placeholder="9876543210"
                                className="block w-full pl-[4.5rem] pr-5 py-4 bg-slate-900/50 border border-slate-700/50 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all placeholder:text-slate-600 font-medium tracking-wider"
                                maxLength={10}
                                required
                            />
                        </div>
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 font-black rounded-2xl shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                        ) : 'Send OTP via WhatsApp'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerify} className="space-y-8">
                    <div className="text-center">
                        <p className="text-sm text-slate-400 font-medium">
                            Enter the code sent to <span className="text-white font-bold ml-1">+91 {phone}</span>
                        </p>
                    </div>
                    <div className="flex justify-between gap-2 px-2">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                value={digit}
                                onChange={(e) => handleOtpChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="w-12 h-14 text-center bg-slate-900/50 border border-slate-700/50 rounded-xl text-white text-2xl font-black focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all select-none"
                                maxLength={1}
                            />
                        ))}
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium text-center bg-red-500/10 py-2 rounded-lg border border-red-500/20">{error}</p>}
                    <div className="space-y-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 font-black rounded-2xl shadow-lg hover:shadow-amber-500/20 transition-all uppercase tracking-widest text-sm active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                            ) : (
                                'Verify & Claim'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep('phone')}
                            className="w-full text-xs text-slate-500 hover:text-white font-bold transition-colors uppercase tracking-[0.2em]"
                        >
                            Edit Phone Number
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default OTPForm;
