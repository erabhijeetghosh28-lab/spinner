'use client';

import Link from 'next/link';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    campaignsPerMonth: number;
    spinsPerMonth: number | null;
    vouchersPerMonth: number | null;
    socialMediaEnabled: boolean;
    isMostPopular: boolean;
    campaignDurationDays: number;
    customBranding: boolean;
    advancedAnalytics: boolean;
}

interface PricingSectionProps {
    plans: Plan[];
    loading: boolean;
}

export function PricingSection({ plans, loading }: PricingSectionProps) {
    return (
        <section className="py-28 bg-white" id="pricing">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-20">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                        Pricing
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">Choose Your Growth Plan</h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Transparent pricing for businesses of all sizes. No hidden fees.
                    </p>
                </div>
                
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-600">Loading pricing plans...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => {
                            const features: string[] = [];
                            
                            if (plan.campaignsPerMonth === 999 || plan.campaignsPerMonth >= 100) {
                                features.push('Unlimited Campaigns');
                            } else {
                                features.push(`${plan.campaignsPerMonth} Active Campaign${plan.campaignsPerMonth > 1 ? 's' : ''}`);
                            }
                            
                            if (plan.vouchersPerMonth === null) {
                                features.push('Unlimited Vouchers');
                            } else {
                                features.push(`${plan.vouchersPerMonth.toLocaleString()} Vouchers / mo`);
                            }
                            
                            if (plan.spinsPerMonth === null && plan.vouchersPerMonth === null) {
                                features.push('Unlimited Spins');
                            } else if (plan.spinsPerMonth && plan.spinsPerMonth > 0) {
                                features.push(`${plan.spinsPerMonth.toLocaleString()} Spins / mo`);
                            }
                            
                            if (plan.socialMediaEnabled) {
                                features.push('WhatsApp CRM & Automation');
                                features.push('Zero-Fraud Anti-Bot Engine');
                            }
                            if (plan.customBranding) features.push('Branded QR & UI Overlays');
                            
                            features.push(plan.advancedAnalytics ? 'Real-time ROI Dashboard' : 'Performance Analytics');
                            features.push('Viral Referral Mechanics');
                            features.push('Staff Manager Verification');
                            features.push('PII Masking & Data Privacy');
                            
                            if (plan.price === 0 || plan.name.toLowerCase().includes('enterprise')) {
                                features.push('Direct API Webhooks');
                                features.push('White-label Domains');
                                features.push('24/7 Priority Concierge');
                            }
                            
                            features.push(`Campaign Life: ${plan.campaignDurationDays} Days`);
                            
                            const isFeatured = plan.isMostPopular;
                            const priceInRupees = plan.price / 100;
                            const priceDisplay = plan.price === 0 ? 'Custom' : `₹${priceInRupees.toLocaleString('en-IN')}`;
                            
                            return (
                                <div key={plan.id} className={`p-10 rounded-3xl flex flex-col ${isFeatured ? 'border-2 border-cyan-500 shadow-2xl shadow-cyan-500/10 scale-105 relative' : 'border-2 border-gray-200'} transition-all duration-300 hover:shadow-xl group`}>
                                    {isFeatured && (
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-xs font-bold px-6 py-2 rounded-full uppercase tracking-widest shadow-lg">
                                            Most Popular
                                        </div>
                                    )}
                                    <h3 className="text-2xl font-bold mb-3 text-slate-900">{plan.name}</h3>
                                    <div className="flex items-baseline gap-2 mb-8">
                                        <span className="text-5xl font-bold text-slate-900">{priceDisplay}</span>
                                        {plan.price !== 0 && <span className="text-slate-500">/{plan.interval.toLowerCase().replace('monthly', 'mo')}</span>}
                                    </div>
                                    
                                    <ul className="space-y-5 mb-10 flex-grow">
                                        {features.map((feature, j) => (
                                            <li key={j} className="flex items-center gap-3 text-sm text-slate-600">
                                                <span className="text-cyan-500 font-bold">✓</span>
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
                
                {/* Feature Comparison Link */}
                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-sm">
                        Need a custom enterprise solution? <button onClick={() => {}} className="text-cyan-600 font-bold hover:underline">Contact our sales team</button>
                    </p>
                </div>
            </div>
        </section>
    );
}
