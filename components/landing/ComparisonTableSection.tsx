'use client';

import { motion } from 'framer-motion';

export function ComparisonTableSection() {
    const features = [
        { 
            name: 'Spin Wheels & Games', 
            leadSpin: '✅ Unlimited campaigns', 
            others: '⚠️ 1-3 campaigns max', 
            diy: '❌ Manual only'
        },
        { 
            name: 'WhatsApp CRM & Automation', 
            leadSpin: '✅ Built-in (2k-20k msgs/mo)', 
            others: '❌ Not available', 
            diy: '❌ Zapier integrations only'
        },
        { 
            name: 'Anti-Fraud Engine', 
            leadSpin: '✅ Adaptive AI (4 strategies)', 
            others: '❌ None/Basic rules only', 
            diy: '❌ None'
        },
        { 
            name: 'Social Media Task Engine', 
            leadSpin: '✅ 4 platforms (10k/hr)', 
            others: '❌ Not available', 
            diy: '❌ Manual verification'
        },
        { 
            name: 'Branded QR Code Generator', 
            leadSpin: '✅ Print-ready (800x1200)', 
            others: '❌ None/Basic QR only', 
            diy: '❌ Canva needed'
        },
        { 
            name: 'Real-time Analytics Dashboard', 
            leadSpin: '✅ Live updates (< 500ms)', 
            others: '⚠️ Daily/Weekly batches', 
            diy: '❌ Google Sheets'
        },
        { 
            name: 'Live Leaderboards', 
            leadSpin: '✅ Real-time rankings', 
            others: '❌ Not available', 
            diy: '❌ Not possible'
        },
        { 
            name: 'Direct Spin Grants', 
            leadSpin: '✅ Manager phone search', 
            others: '❌ Not available', 
            diy: '❌ Manual only'
        },
        { 
            name: 'Multi-Use Vouchers', 
            leadSpin: '✅ Configurable limits', 
            others: '⚠️ Single-use only', 
            others_val: '⚠️', // For getCellStyle
            diy: '❌ Manual tracking'
        },
        { 
            name: 'Manager RBAC & Permissions', 
            leadSpin: '✅ Granular controls', 
            others: '❌ Limited/None', 
            diy: '❌ Not available'
        },
        { 
            name: 'API & Webhooks', 
            leadSpin: '✅ Full REST + Webhooks', 
            others: '❌ None/Read-only', 
            diy: '❌ None'
        },
        { 
            name: 'Data Export & Portability', 
            leadSpin: '✅ CSV/JSON anytime', 
            others: '❌ Limited/Request only', 
            diy: '✅ Full control'
        },
    ];

    const getCellStyle = (value: string) => {
        if (value.includes('✅')) return 'bg-emerald-50 text-emerald-700';
        if (value.includes('❌')) return 'bg-red-50 text-red-600';
        if (value.includes('⚠️')) return 'bg-amber-50 text-amber-700';
        return 'bg-slate-50 text-slate-700';
    };

    return (
        <section className="py-24 bg-gradient-to-br from-slate-50 to-white" id="comparison">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                        Why Choose LeadSpin
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                        One Platform. Half the Cost. 10x the Features.
                    </h2>
                    <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                        Stop juggling 5+ tools and paying premium prices for basic features. See how LeadSpin compares to alternatives.
                    </p>
                </motion.div>

                {/* Feature Comparison Table */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-12"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left p-6 font-bold text-slate-900 text-sm uppercase tracking-wider">Feature</th>
                                    <th className="p-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white font-bold text-lg">L</div>
                                            <span className="font-bold text-slate-900">LeadSpin</span>
                                            <span className="text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-100 rounded-full">Best Value</span>
                                        </div>
                                    </th>
                                    <th className="p-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">🎯</div>
                                            <span className="font-bold text-slate-700">Other Alternatives</span>
                                        </div>
                                    </th>
                                    <th className="p-6 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-lg">💻</div>
                                            <span className="font-bold text-slate-700">DIY Solution</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {features.map((feature, i) => (
                                    <motion.tr 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.4, delay: i * 0.05 }}
                                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                                    >
                                        <td className="p-6 font-semibold text-slate-900 text-sm">{feature.name}</td>
                                        <td className={`p-4 text-center text-xs font-medium ${getCellStyle(feature.leadSpin)}`}>
                                            {feature.leadSpin}
                                        </td>
                                        <td className={`p-4 text-center text-xs font-medium ${getCellStyle(feature.others)}`}>
                                            {feature.others}
                                        </td>
                                        <td className={`p-4 text-center text-xs font-medium ${getCellStyle(feature.diy)}`}>
                                            {feature.diy}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-emerald-100 rounded border border-emerald-200"></div>
                        <span className="text-slate-600">✅ Fully Supported</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-amber-100 rounded border border-amber-200"></div>
                        <span className="text-slate-600">⚠️ Limited/Partial</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 rounded border border-red-200"></div>
                        <span className="text-slate-600">❌ Not Available</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
