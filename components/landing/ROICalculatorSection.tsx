'use client';

import { motion } from 'framer-motion';
import { Calculator, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { useState } from 'react';

export function ROICalculatorSection() {
    const [footTraffic, setFootTraffic] = useState(1000);
    const [avgTransaction, setAvgTransaction] = useState(500);
    const [targetRepeatRate, setTargetRepeatRate] = useState(30);
    const [planCost, setPlanCost] = useState(999);

    // ROI Calculations
    const conversionRate = 0.15; // 15% of foot traffic tries the wheel
    const monthlySpins = footTraffic * conversionRate;
    const repeatMultiplier = 1 + (targetRepeatRate / 100);
    const monthlyRevenue = monthlySpins * avgTransaction * repeatMultiplier;
    const netRevenue = monthlyRevenue - planCost;
    const roi = ((netRevenue / planCost) * 100).toFixed(0);
    const paybackDays = ((planCost / monthlyRevenue) * 30).toFixed(1);

    return (
        <section className="py-24 bg-gradient-to-br from-cyan-50 to-blue-50 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-30">
                <div className="absolute top-20 right-10 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                        <Calculator className="w-4 h-4" />
                        ROI Calculator
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                        Calculate Your Potential ROI
                    </h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Real businesses see an average <strong>387% ROI</strong> in the first 90 days. See your custom projection below.
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left: Input Controls */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-xl"
                    >
                        <h3 className="text-2xl font-bold text-slate-900 mb-8">Your Business Metrics</h3>
                        
                        {/* Slider 1: Foot Traffic */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-slate-700">Monthly Foot Traffic</label>
                                <span className="text-2xl font-bold text-cyan-600">{footTraffic.toLocaleString()}</span>
                            </div>
                            <input 
                                type="range" 
                                min="100" 
                                max="10000" 
                                step="100"
                                value={footTraffic}
                                onChange={(e) => setFootTraffic(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>100</span>
                                <span>10,000</span>
                            </div>
                        </div>

                        {/* Slider 2: Avg Transaction */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-slate-700">Avg. Transaction Value</label>
                                <span className="text-2xl font-bold text-cyan-600">₹{avgTransaction}</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="500" 
                                step="10"
                                value={avgTransaction}
                                onChange={(e) => setAvgTransaction(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>₹10</span>
<span>₹500</span>
                            </div>
                        </div>

                        {/* Slider 3: Repeat Rate */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-semibold text-slate-700">Target Repeat Customer Rate</label>
                                <span className="text-2xl font-bold text-cyan-600">{targetRepeatRate}%</span>
                            </div>
                            <input 
                                type="range" 
                                min="10" 
                                max="60" 
                                step="5"
                                value={targetRepeatRate}
                                onChange={(e) => setTargetRepeatRate(Number(e.target.value))}
                                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-cyan-600"
                            />
                            <div className="flex justify-between text-xs text-slate-500 mt-1">
                                <span>10%</span>
                                <span>60%</span>
                            </div>
                        </div>

                        {/* Plan Selector */}
                        <div>
                            <label className="text-sm font-semibold text-slate-700 block mb-3">Select Plan</label>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { name: 'Starter', cost: 999 },
                                    { name: 'Pro', cost: 4999 },
                                    { name: 'Enterprise', cost: 9999 }
                                ].map((plan) => (
                                    <button
                                        key={plan.cost}
                                        onClick={() => setPlanCost(plan.cost)}
                                        className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                                            planCost === plan.cost
                                                ? 'border-cyan-500 bg-cyan-50 text-cyan-700'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        {plan.name}<br />
                                        <span className="text-xs font-normal">₹{plan.cost}/mo</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right: Results */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7 }}
                        className="space-y-6"
                    >
                        {/* Main ROI Card */}
                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl p-8 md:p-10 text-white shadow-2xl">
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="w-8 h-8" />
                                <h3 className="text-2xl font-bold">Your Projected ROI</h3>
                            </div>
                            <div className="text-7xl font-bold mb-2">{roi}%</div>
                            <p className="text-emerald-100 text-lg">Return on Investment (Monthly)</p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-6">
                            {/* Additional Revenue */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <DollarSign className="w-5 h-5 text-cyan-600" />
                                    <span className="text-sm font-semibold text-slate-600">Net Monthly Revenue</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">₹{netRevenue.toLocaleString()}</div>
                                <p className="text-xs text-slate-500 mt-2">After platform cost</p>
                            </div>

                            {/* Payback Period */}
                            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
                                <div className="flex items-center gap-2 mb-3">
                                    <Clock className="w-5 h-5 text-amber-600" />
                                    <span className="text-sm font-semibold text-slate-600">Payback Period</span>
                                </div>
                                <div className="text-3xl font-bold text-slate-900">{paybackDays}</div>
                                <p className="text-xs text-slate-500 mt-2">days to break even</p>
                            </div>
                        </div>

                        {/* Breakdown Card */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg">
                            <h4 className="font-bold text-slate-900 mb-4">Revenue Breakdown</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Monthly Spins</span>
                                    <span className="font-semibold text-slate-900">{monthlySpins.toFixed(0)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Conversion Rate</span>
                                    <span className="font-semibold text-slate-900">15%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Repeat Multiplier</span>
                                    <span className="font-semibold text-slate-900">{repeatMultiplier.toFixed(2)}x</span>
                                </div>
                                <div className="h-px bg-slate-200"></div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Gross Revenue</span>
                                    <span className="font-bold text-emerald-600">₹{monthlyRevenue.toFixed(0)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-600">Platform Cost</span>
                                    <span className="font-semibold text-red-600">-₹{planCost}</span>
                                </div>
                                <div className="h-px bg-slate-200"></div>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-slate-900">Net Profit</span>
                                    <span className="font-bold text-xl text-emerald-600">₹{netRevenue.toFixed(0)}</span>
                                </div>
                            </div>
                        </div>

                        {/* CTA */}
                        <button className="w-full py-5 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-2xl font-bold text-lg shadow-xl transition-all hover:-translate-y-1 active:scale-95">
                            Start Your Free Trial →
                        </button>
                    </motion.div>
                </div>

                {/* Disclaimer */}
                <p className="text-center text-sm text-slate-500 mt-12 max-w-3xl mx-auto">
                    * Calculations are estimates based on industry averages. Actual results may vary depending on your business model, target audience, and campaign execution.
                    Average customer data shows 47% repeat rate increase and 2.3 month payback period.
                </p>
            </div>
        </section>
    );
}
