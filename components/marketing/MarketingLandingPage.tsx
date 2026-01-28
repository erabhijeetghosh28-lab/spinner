'use client';

import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    campaignsPerMonth: number;
    spinsPerMonth: number | null;
    vouchersPerMonth: number | null;
    socialMediaEnabled: boolean;
    customBranding: boolean;
    advancedAnalytics: boolean;
    _count?: {
        tenants: number;
    };
}

export default function MarketingLandingPage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const response = await axios.get('/api/admin/super/plans');
                setPlans(response.data.plans || []);
            } catch (error) {
                console.error('Error fetching plans:', error);
                // Fallback to default plans if API fails
                setPlans([
                    { 
                        id: '1', 
                        name: 'Starter', 
                        price: 999, 
                        interval: 'MONTHLY',
                        campaignsPerMonth: 1,
                        spinsPerMonth: null,
                        vouchersPerMonth: 500,
                        socialMediaEnabled: false,
                        customBranding: false,
                        advancedAnalytics: false
                    },
                    { 
                        id: '2', 
                        name: 'Pro', 
                        price: 4999, 
                        interval: 'MONTHLY',
                        campaignsPerMonth: 5,
                        spinsPerMonth: null,
                        vouchersPerMonth: 5000,
                        socialMediaEnabled: true,
                        customBranding: true,
                        advancedAnalytics: false
                    },
                    { 
                        id: '3', 
                        name: 'Enterprise', 
                        price: 0, 
                        interval: 'MONTHLY',
                        campaignsPerMonth: 999,
                        spinsPerMonth: null,
                        vouchersPerMonth: null,
                        socialMediaEnabled: true,
                        customBranding: true,
                        advancedAnalytics: true
                    }
                ]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPlans();
    }, []);
    
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="bg-[#fafbfc] overflow-x-hidden">
            {/* Header */}
            <header className="w-full border-b border-gray-100 bg-white/95 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="size-11 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <span className="text-2xl font-bold tracking-tight text-slate-900">SpinWheel</span>
                    </div>
                    
                    <div className="flex items-center gap-8">
                        <nav className="hidden md:flex items-center gap-8">
                            <button onClick={() => scrollToSection('features')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                                Features
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                            </button>
                            <button onClick={() => scrollToSection('how-it-works')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                                How it Works
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                            </button>
                            <button onClick={() => scrollToSection('pricing')} className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200 relative group">
                                Pricing
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-cyan-500 transition-all duration-200 group-hover:w-full"></span>
                            </button>
                        </nav>
                        
                        <div className="flex items-center gap-6">
                            <Link href="/admin" className="text-[15px] font-semibold text-slate-600 hover:text-cyan-500 transition-colors duration-200">
                                Login
                            </Link>
                            <Link href="/admin/signup" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40 active:scale-95">
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-br from-[#fafbfc] via-slate-50 to-[#fafbfc]">
                {/* Background decorations */}
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-cyan-600/5 rounded-full blur-3xl"></div>
                
                <div className="max-w-7xl mx-auto px-6 lg:px-20 grid lg:grid-cols-2 gap-20 items-center relative z-10">
                    {/* Left Content */}
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                            </span>
                            New: WhatsApp Automation 2.0
                        </div>
                        
                        <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.1] mb-8">
                            Gamify Your Marketing. 
                            <span className="block mt-2 bg-clip-text text-transparent bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500">
                                Verify Every Voucher.
                            </span>
                        </h1>
                        
                        <p className="text-xl text-slate-600 leading-relaxed mb-12 max-w-lg">
                            The all-in-one platform to create <strong className="text-slate-900 font-semibold">viral spin-to-win campaigns</strong> and instantly verify rewards with our seamless web-scanner.
                        </p>
                        
                        <div className="flex flex-wrap gap-4">
                            <Link href="/admin/signup" className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 group">
                                Start Free Trial
                                <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                            </Link>
                            <button className="bg-white border-2 border-gray-200 hover:border-cyan-500/50 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all duration-300 hover:shadow-lg active:scale-95 group">
                                <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                                </svg>
                                Watch Demo
                            </button>
                        </div>
                        
                        {/* Trust indicators */}
                        <div className="mt-16 pt-8 border-t border-gray-200">
                            <div className="flex items-center gap-8 flex-wrap">
                                <div className="flex items-center gap-2">
                                    <div className="flex -space-x-2">
                                        <div className="size-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-white"></div>
                                        <div className="size-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-white"></div>
                                        <div className="size-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white"></div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="font-bold text-slate-900">2,500+</div>
                                        <div className="text-slate-600 text-xs">Happy Users</div>
                                    </div>
                                </div>
                                
                                <div className="h-8 w-px bg-gray-200"></div>
                                
                                <div className="text-sm">
                                    <div className="flex items-center gap-1 mb-1">
                                        <span className="text-amber-500">★★★★★</span>
                                    </div>
                                    <div className="text-slate-600 text-xs">4.9/5 Rating</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Content - Phone Mockup with Scrolling Demo */}
                    <div className="relative animate-float">
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 blur-3xl rounded-full scale-75"></div>
                        
                        <div className="relative mx-auto w-[300px] h-[620px] bg-slate-900 rounded-[3.5rem] border-[10px] border-slate-900 shadow-2xl overflow-hidden">
                            {/* Notch */}
                            <div className="h-7 w-28 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-3xl z-10 shadow-lg"></div>
                            
                            {/* Screen content - Scrolling Campaign Demo */}
                            <div className="h-full overflow-hidden bg-gradient-to-br from-white to-gray-50">
                                <div className="h-[150%] animate-phone-scroll">
                                    {/* Section 1: Spinner */}
                                    <div className="h-[66.67%] p-6 flex flex-col items-center justify-center gap-4">
                                        <div className="text-center space-y-1">
                                            <h4 className="font-bold text-slate-900 text-base">Spin & Win!</h4>
                                            <p className="text-[10px] text-slate-600">Good luck! 🎉</p>
                                        </div>
                                        
                                        {/* Spinning Wheel */}
                                        <div className="relative size-44 rounded-full border-8 border-white shadow-2xl flex items-center justify-center">
                                            <div className="absolute inset-0 rounded-full border-4 border-white shadow-inner animate-spin"
                                                 style={{
                                                     background: 'conic-gradient(from 0deg, #0f172a 0deg 45deg, #f59e0b 45deg 90deg, #0f172a 90deg 135deg, #f59e0b 135deg 180deg, #0f172a 180deg 225deg, #f59e0b 225deg 270deg, #0f172a 270deg 315deg, #f59e0b 315deg 360deg)'
                                                 }}>
                                            </div>
                                            <div className="absolute size-4 bg-white rounded-full shadow-lg z-10 border-2 border-slate-900"></div>
                                            <div className="absolute -top-1 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-slate-900 z-20 drop-shadow-lg"></div>
                                        </div>
                                        
                                        {/* Spin Button */}
                                        <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/40">
                                            SPIN NOW
                                        </button>
                                        
                                        {/* Social Tasks Preview */}
                                        <div className="w-full space-y-2 mt-4">
                                            <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">f</div>
                                                    <span className="text-[10px] font-semibold text-slate-700">Follow Us</span>
                                                </div>
                                                <span className="text-[9px] bg-cyan-500 text-white px-2 py-1 rounded-full font-bold">+1</span>
                                            </div>
                                            <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">↗</div>
                                                    <span className="text-[10px] font-semibold text-slate-700">Share</span>
                                                </div>
                                                <span className="text-[9px] bg-green-500 text-white px-2 py-1 rounded-full font-bold">+2</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Section 2: Featured Products */}
                                    <div className="h-[66.67%] bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col gap-4">
                                        <div>
                                            <h3 className="text-white text-sm font-bold mb-1">Featured Highlights</h3>
                                            <div className="h-0.5 w-12 bg-amber-500 rounded-full"></div>
                                        </div>
                                        
                                        {/* Product Card 1 */}
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                                            <div className="h-28 bg-gradient-to-br from-amber-400 to-orange-500 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-white/30 text-6xl">🎁</div>
                                                </div>
                                                <div className="absolute bottom-2 left-2">
                                                    <span className="bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">Premium</span>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-white text-xs font-bold mb-1">Wellness Bundle</h4>
                                                <p className="text-white/60 text-[9px] leading-tight">Curated collection of premium products</p>
                                                <div className="mt-2 flex items-center gap-1 text-[8px] text-white/50">
                                                    <span>✓</span>
                                                    <span>100% Organic</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Product Card 2 */}
                                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                                            <div className="h-24 bg-gradient-to-br from-cyan-400 to-blue-500 relative">
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="text-white/30 text-5xl">🌿</div>
                                                </div>
                                                <div className="absolute bottom-2 left-2">
                                                    <span className="bg-cyan-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>
                                                </div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-white text-xs font-bold mb-1">Nature Kit</h4>
                                                <p className="text-white/60 text-[9px] leading-tight">Eco-friendly essentials</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-28 bg-white" id="features">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                            Capabilities
                        </span>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">Powerful features for growth</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                            Everything you need to engage, convert, and retain customers through gamified experiences.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: '✨', title: 'Interactive Campaigns', desc: 'Launch fully customizable spin wheels and games that reflect your brand identity perfectly.', color: 'from-cyan-500/10 to-cyan-600/10' },
                            { icon: '🎟️', title: 'Smart Vouchers', desc: 'Dynamic, secure coupon generation with unique codes that prevent fraud and multiple redemptions.', color: 'from-amber-500/10 to-orange-500/10' },
                            { icon: '💬', title: 'WhatsApp Automation', desc: 'Automatically deliver vouchers directly to customers\' WhatsApp for 98% open rates.', color: 'from-green-500/10 to-emerald-500/10' },
                            { icon: '📱', title: 'Merchant Scanner', desc: 'A browser-based scanner for staff to verify vouchers in milliseconds. Zero app installs required.', color: 'from-purple-500/10 to-pink-500/10' },
                            { icon: '📊', title: 'Deep Analytics', desc: 'Monitor campaign performance, redemption rates, and customer acquisition costs in real-time.', color: 'from-blue-500/10 to-indigo-500/10' },
                            { icon: '👥', title: 'Lead Generation', desc: 'Capture emails and phone numbers seamlessly before the wheel spins. Build your CRM naturally.', color: 'from-rose-500/10 to-red-500/10' },
                        ].map((feature, i) => (
                            <div key={i} className="relative p-8 rounded-2xl bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-cyan-500/30 hover:-translate-y-1 group">
                                <div className={`size-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-4xl mb-6 transition-transform duration-300 group-hover:scale-110`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                                <p className="text-slate-600 leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How it Works */}
            <section className="py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative" id="how-it-works">
                <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2760%27%20height%3D%2760%27%20viewBox%3D%270%200%2060%2060%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%23ffffff%27%20fill-opacity%3D%271%27%3E%3Cpath%20d%3D%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
                
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-24">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/30 mb-6">
                            Process
                        </span>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6">The Customer Journey</h2>
                        <p className="text-xl text-gray-300 max-w-2xl mx-auto">Simple, fast, and delightful experience from start to finish</p>
                    </div>
                    
                    <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-16">
                        {[
                            { icon: '🔄', title: 'Spin & Win', desc: 'Customers engage with your branded wheel on any digital touchpoint.' },
                            { icon: '💬', title: 'Receive WhatsApp', desc: 'Prizes are instantly sent via WhatsApp with a secure, unique QR code voucher.' },
                            { icon: '📱', title: 'Scan & Redeem', desc: 'Merchant scans the QR code via any web browser to verify and redeem the offer.' },
                        ].map((step, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                                <div className="size-28 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-cyan-500 flex items-center justify-center text-6xl mb-8 shadow-2xl shadow-cyan-500/30 transition-all duration-300 group-hover:scale-110">
                                    {step.icon}
                                </div>
                                <div className="bg-cyan-500/20 text-cyan-400 text-xs font-bold px-4 py-2 rounded-full mb-5 border border-cyan-500/30">STEP 0{i + 1}</div>
                                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                                <p className="text-gray-300 leading-relaxed max-w-xs">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section className="py-28 bg-white" id="pricing">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                            Pricing
                        </span>
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">Transparent Pricing</h2>
                        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                            Choose the plan that fits your business scale. No hidden fees.
                        </p>
                    </div>
                    
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-slate-600">Loading pricing plans...</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {plans.map((plan, i) => {
                                // Auto-generate features from plan properties
                                const features: string[] = [];
                                
                                // Campaigns
                                if (plan.campaignsPerMonth === 999 || plan.campaignsPerMonth >= 100) {
                                    features.push('Unlimited Campaigns');
                                } else {
                                    features.push(`${plan.campaignsPerMonth} Active Campaign${plan.campaignsPerMonth > 1 ? 's' : ''}`);
                                }
                                
                                // Vouchers
                                if (plan.vouchersPerMonth === null) {
                                    features.push('Unlimited Vouchers');
                                } else {
                                    features.push(`${plan.vouchersPerMonth.toLocaleString()} Vouchers / mo`);
                                }
                                
                                // Spins (if available)
                                if (plan.spinsPerMonth === null && plan.vouchersPerMonth === null) {
                                    features.push('Unlimited Spins');
                                } else if (plan.spinsPerMonth && plan.spinsPerMonth > 0) {
                                    features.push(`${plan.spinsPerMonth.toLocaleString()} Spins / mo`);
                                }
                                
                                // Features based on booleans
                                if (plan.socialMediaEnabled) {
                                    features.push('WhatsApp Delivery');
                                }
                                if (plan.customBranding) {
                                    features.push('Custom Branding');
                                }
                                if (plan.advancedAnalytics) {
                                    features.push('Advanced Analytics');
                                } else {
                                    features.push('Basic Analytics');
                                }
                                
                                // Special features for enterprise
                                if (plan.price === 0 || plan.name.toLowerCase().includes('enterprise')) {
                                    features.push('Dedicated Support');
                                    features.push('API Access');
                                }
                                
                                // Determine if featured (middle plan or most popular)
                                const isFeatured = i === 1 || (plan._count && plan._count.tenants > 0);
                                
                                // Format price (convert from paise to rupees)
                                const priceInRupees = plan.price / 100;
                                const priceDisplay = plan.price === 0 
                                    ? 'Custom' 
                                    : `₹${priceInRupees.toLocaleString('en-IN')}`;
                                
                                return (
                                    <div key={plan.id} className={`p-10 rounded-3xl flex flex-col ${isFeatured ? 'border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10 scale-105 relative' : 'border-2 border-gray-200'} transition-all duration-300 hover:shadow-xl`}>
                                        {isFeatured && (
                                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                                                Most Popular
                                            </div>
                                        )}
                                        <h3 className="text-2xl font-bold mb-3 text-slate-900">{plan.name}</h3>
                                        <div className="flex items-baseline gap-2 mb-8">
                                            <span className="text-5xl font-bold text-slate-900">{priceDisplay}</span>
                                            {plan.price > 0 && <span className="text-slate-600 font-medium">/{plan.interval.toLowerCase()}</span>}
                                        </div>
                                        
                                        <ul className="space-y-5 mb-10 flex-grow">
                                            {features.map((feature, j) => (
                                                <li key={j} className="flex items-center gap-3 text-base">
                                                    <span className="text-green-500 text-xl">✓</span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                        
                                        <Link href="/admin/signup" className={`w-full py-4 rounded-xl font-bold text-base text-center transition-all duration-300 active:scale-95 ${isFeatured ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5' : 'border-2 border-cyan-500 text-cyan-600 hover:bg-cyan-500 hover:text-white'}`}>
                                            {isFeatured ? 'Start 14-Day Free Trial' : 'Select Plan'}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-900 text-white pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 pb-16 border-b border-white/10">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="size-11 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center text-white">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                </div>
                                <span className="text-2xl font-bold">SpinWheel</span>
                            </div>
                            <p className="text-gray-400 leading-relaxed mb-8">
                                The ultimate gamification platform for digital marketing and secure voucher verification.
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-lg mb-6">Product</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><button onClick={() => scrollToSection('features')} className="hover:text-cyan-500 transition-colors duration-200">Features</button></li>
                                <li><a href="#" className="hover:text-cyan-500 transition-colors duration-200">Integrations</a></li>
                                <li><button onClick={() => scrollToSection('pricing')} className="hover:text-cyan-500 transition-colors duration-200">Pricing</button></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-lg mb-6">Company</h4>
                            <ul className="space-y-4 text-gray-400">
                                <li><a href="#" className="hover:text-cyan-500 transition-colors duration-200">About Us</a></li>
                                <li><a href="#" className="hover:text-cyan-500 transition-colors duration-200">Contact</a></li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 className="font-bold text-lg mb-6">Get Started</h4>
                            <Link href="/admin/signup" className="block w-full py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-bold rounded-xl text-center transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 active:scale-95">
                                Start Free Trial
                            </Link>
                        </div>
                    </div>
                    
                    <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-500">
                        <p>© 2024 SpinWheel SaaS Platform. All rights reserved.</p>
                        <div className="flex gap-8">
                            <a href="#" className="hover:text-white transition-colors duration-200">Privacy Policy</a>
                            <a href="#" className="hover:text-white transition-colors duration-200">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
