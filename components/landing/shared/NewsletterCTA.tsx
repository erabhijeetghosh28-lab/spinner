'use client';

import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';

interface NewsletterCTAProps {
    variant?: 'light' | 'dark' | 'cyan';
    heading?: string;
    description?: string;
    buttonText?: string;
}

export default function NewsletterCTA({ 
    variant = 'light',
    heading = 'Join the Brand Revolution',
    description = 'Be the first to hear about our next campaign and exclusive product highlights.',
    buttonText = 'GET EARLY ACCESS'
}: NewsletterCTAProps) {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!email) {
            toast.error('Please enter your email');
            return;
        }

        setIsSubmitting(true);
        try {
            await axios.post('/api/newsletter/subscribe', { email });
            toast.success('Successfully subscribed to our newsletter!');
            setEmail('');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to subscribe');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Theme-specific styles
    const themes = {
        light: {
            sectionBg: 'bg-transparent',
            containerBg: 'bg-white/80 backdrop-blur-sm border-gray-100',
            headingColor: 'text-[#181411]',
            descColor: 'text-[#8a7560]',
            inputBg: 'bg-white border-gray-200 focus:border-[#f48c25] text-[#181411] placeholder-gray-400',
            buttonBg: 'bg-[#f48c25] hover:bg-[#f48c25]/90 text-white',
            subtextColor: 'text-gray-500'
        },
        dark: {
            sectionBg: 'bg-transparent',
            containerBg: 'bg-[#1a120b]/60 backdrop-blur-md border-white/10',
            headingColor: 'text-white',
            descColor: 'text-gray-400',
            inputBg: 'bg-[#0a0f1d] border-white/10 focus:ring-2 focus:ring-[#f48c25] focus:border-transparent text-white placeholder-gray-500',
            buttonBg: 'bg-[#f48c25] hover:brightness-110 text-white shadow-[0_0_15px_rgba(244,140,37,0.3)]',
            subtextColor: 'text-gray-500'
        },
        cyan: {
            sectionBg: 'bg-transparent',
            containerBg: 'glass-panel border-[#00f2ff]/20',
            headingColor: 'text-white',
            descColor: 'text-gray-400',
            inputBg: 'bg-[#0a0f1d] border-white/10 focus:ring-2 focus:ring-[#00f2ff] focus:border-transparent text-white placeholder-gray-500',
            buttonBg: 'bg-[#00f2ff] hover:brightness-110 text-[#0a0f1d] font-extrabold shadow-[0_0_15px_rgba(0,242,255,0.3)]',
            subtextColor: 'text-gray-500'
        }
    };

    const theme = themes[variant];

    return (
        <section className={`w-full py-20 px-6 ${theme.sectionBg}`}>
            <div className={`max-w-[800px] mx-auto ${theme.containerBg} p-10 rounded-[2rem] text-center flex flex-col gap-6 shadow-2xl border`}>
                <h2 className={`${theme.headingColor} text-4xl font-black tracking-tight`}>
                    {heading}
                </h2>
                <p className={`${theme.descColor} text-lg`}>
                    {description}
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`flex-1 h-14 rounded-xl px-6 ${theme.inputBg} transition-all`}
                        placeholder="Enter your email"
                        required
                    />
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`h-14 px-10 rounded-xl font-bold transition-all ${theme.buttonBg} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        {isSubmitting ? 'SUBSCRIBING...' : buttonText}
                    </button>
                </form>

                <p className={`text-[10px] ${theme.subtextColor} uppercase tracking-widest font-bold`}>
                    Stay updated with exclusive offers
                </p>
            </div>
        </section>
    );
}
