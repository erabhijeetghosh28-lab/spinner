'use client';

import { motion } from 'framer-motion';

export function FeaturesSection() {
    const features = [
        { icon: '🚀', title: 'Infinite Growth Campaigns', desc: 'Launch unlimited spin wheels, scratch cards, and games. 100% customizable to your brand DNA.', color: 'from-cyan-500/10 to-cyan-600/10' },
        { icon: '📱', title: 'WhatsApp Engagement CRM', desc: 'Automated prize delivery, OTP verification, and re-engagement via WhatsApp. No more lost leads.', color: 'from-green-500/10 to-emerald-500/10' },
        { icon: '📊', title: 'ROI-Focused Analytics', desc: 'Track Monthly Recurring Revenue (MRR), Customer Acquisition Cost (CAC), and LTV in one dashboard.', color: 'from-blue-500/10 to-indigo-500/10' },
        { icon: '🛡️', title: 'Anti-Fraud Engine', desc: 'Adaptive verification & manager level approvals. Stop fake entries and multiple redemptions forever.', color: 'from-amber-500/10 to-orange-500/10' },
        { icon: '🎯', title: 'Social Media Growth Engine', desc: 'Reward Instagram follows, Facebook likes, and YouTube subscribes automatically. Our adaptive system scales from 1 to 10,000 users/hour.', color: 'from-pink-500/10 to-rose-500/10' },
        { icon: '🏆', title: 'Live Leaderboards & Gamification', desc: 'Real-time ranking of top spinners. Drive viral engagement with competitive mechanics and instant updates.', color: 'from-violet-500/10 to-purple-500/10' },
        { icon: '🎨', title: 'Print-Ready Branded QR Posters', desc: 'Not just codes—generate 800x1200 marketing posters with your logo, colors, and contact info embedded. Table standees made easy.', color: 'from-orange-500/10 to-red-500/10' },
        { icon: '⚡', title: 'Direct Spin Grant System', desc: 'Managers can reward walk-in customers instantly via phone search. Perfect for standee activations with full audit trails.', color: 'from-teal-500/10 to-cyan-500/10' },
        { icon: '🔔', title: 'Smart Inventory Alerts', desc: 'Never run out of prizes. Automated low-stock notifications and prize tracking keep your campaigns running smoothly.', color: 'from-indigo-500/10 to-blue-500/10' },
        { icon: '🔗', title: 'Viral Referral Engine', desc: 'Auto-grant bonus spins for every successful referral. Turn your customers into your marketing team.', color: 'from-purple-500/10 to-pink-500/10' },
        { icon: '📍', title: 'Omnichannel QR Standees', desc: 'Print-ready high-res QR codes for physical tables. Bridge the gap between offline and online.', color: 'from-rose-500/10 to-red-500/10' },
    ];

    return (
        <section className="py-28 bg-white" id="features">
            <div className="max-w-7xl mx-auto px-6">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-600 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                        Platform Capabilities
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6 text-slate-900">Everything you need to grow</h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Not just spin wheels—a complete growth stack with WhatsApp CRM, analytics, anti-fraud, and viral mechanics built in.
                    </p>
                </motion.div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            whileHover={{ 
                                scale: 1.03,
                                rotateY: 3,
                                rotateX: -2,
                                transition: { duration: 0.3 }
                            }}
                            style={{ transformStyle: 'preserve-3d' }}
                            className="relative p-8 rounded-2xl bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-cyan-500/30 group"
                        >
                            <motion.div 
                                animate={{
                                    scale: [1, 1.05, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                className={`size-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-4xl mb-6 transition-transform duration-300 group-hover:scale-110`}
                            >
                                {feature.icon}
                            </motion.div>
                            <h3 className="text-xl font-bold mb-4 text-slate-900">{feature.title}</h3>
                            <p className="text-slate-600 leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
