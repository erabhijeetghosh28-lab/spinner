'use client';

import { motion } from 'framer-motion';
import { Activity, Clock, DollarSign, Ticket, TrendingUp } from 'lucide-react';
import { Bar, BarChart, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

// Mock data matching real analytics service patterns
const spinData = [
    { time: 'Mon', spins: 120, vouchers: 84 },
    { time: 'Tue', spins: 145, vouchers: 102 },
    { time: 'Wed', spins: 189, vouchers: 132 },
    { time: 'Thu', spins: 167, vouchers: 117 },
    { time: 'Fri', spins: 201, vouchers: 141 },
    { time: 'Sat', spins: 234, vouchers: 164 },
    { time: 'Sun', spins: 189, vouchers: 132 },
    { time: 'Today', spins: 256, vouchers: 179 }
];

const hourlyData = [
    { hour: '9AM', activity: 12 },
    { hour: '10AM', activity: 24 },
    { hour: '11AM', activity: 45 },
    { hour: '12PM', activity: 78 },
    { hour: '1PM', activity: 92 },
    { hour: '2PM', activity: 65 },
    { hour: '3PM', activity: 88 },
    { hour: '4PM', activity: 102 },
    { hour: '5PM', activity: 125 },
    { hour: '6PM', activity: 145 },
    { hour: '7PM', activity: 167 },
    { hour: '8PM', activity: 134 }
];

export function AnalyticsDashboardMockup() {
    const activities = [
        { time: '2s ago', text: 'Priya R. won 20% OFF Voucher', icon: '🎁', color: 'text-emerald-600' },
        { time: '5s ago', text: 'Rahul M. completed Instagram Follow task', icon: '📸', color: 'text-pink-600' },
        { time: '12s ago', text: 'Ananya K. redeemed BUY1GET1 voucher', icon: '✓', color: 'text-cyan-600' },
        { time: '18s ago', text: 'Vikram S. referred 3 new customers', icon: '🔗', color: 'text-purple-600' },
        { time: '23s ago', text: 'Neha P. won FREE DRINK prize', icon: '🥤', color: 'text-orange-600' }
    ];

    const metrics = [
        { 
            label: 'Total Spins Today', 
            value: '1,284', 
            change: '+23%', 
            changeType: 'increase', 
            icon: Activity,
            color: 'cyan'
        },
        { 
            label: 'Vouchers Issued', 
            value: '892', 
            change: '+18%', 
            changeType: 'increase', 
            icon: Ticket,
            color: 'emerald'
        },
        { 
            label: 'Redemption Rate', 
            value: '67%', 
            change: '+5%', 
            changeType: 'increase', 
            icon: TrendingUp,
            color: 'amber'
        },
        { 
            label: 'Est. Revenue Impact', 
            value: '₹45,230', 
            change: '+31%', 
            changeType: 'increase', 
            icon: DollarSign,
            color: 'purple'
        }
    ];

    const getColorClasses = (color: string) => {
        const colors: any = {
            cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', border: 'border-cyan-200' },
            emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200' },
            amber: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200' },
            purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-200' }
        };
        return colors[color] || colors.cyan;
    };

    return (
        <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
            {/* Background accents */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-20 left-20 w-96 h-96 bg-cyan-500/30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"></div>
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/20 mb-6">
                        Real-Time Analytics
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
                        Data-Driven Decision Making
                    </h2>
                    <p className="text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Track every spin, voucher, and redemption in real-time. Process 2.5M daily events with &lt; 500ms latency.
                    </p>
                </motion.div>

                {/* Dashboard Container */}
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden"
                >
                    {/* Dashboard Header */}
                    <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Analytics Dashboard</h3>
                                <p className="text-sm text-slate-400">Real-time performance metrics</p>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Live</span>
                            </div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 bg-slate-50">
                        {metrics.map((metric, i) => {
                            const colors = getColorClasses(metric.color);
                            return (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">{metric.label}</span>
                                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                                            <metric.icon className={`w-4 h-4 ${colors.text}`} />
                                        </div>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900 mb-2">{metric.value}</div>
                                    <div className="flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3 text-emerald-500" />
                                        <span className="text-xs font-semibold text-emerald-600">{metric.change}</span>
                                        <span className="text-xs text-slate-500">vs. yesterday</span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/*Charts Section */}
                    <div className="grid lg:grid-cols-2 gap-8 p-8">
                        {/* Line Chart: Weekly Trend */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-slate-900">Weekly Performance</h4>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-cyan-500 rounded-full"></div>
                                        <span className="text-xs text-slate-600">Spins</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                                        <span className="text-xs text-slate-600">Vouchers</span>
                                    </div>
                                </div>
                            </div>
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={spinData}>
                                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b', 
                                            border: 'none', 
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="spins" 
                                        stroke="#06b6d4" 
                                        strokeWidth={3}
                                        dot={{ fill: '#06b6d4', r: 4 }}
                                        animationDuration={1500}
                                    />
                                    <Line 
                                        type="monotone" 
                                        dataKey="vouchers" 
                                        stroke="#10b981" 
                                        strokeWidth={3}
                                        dot={{ fill: '#10b981', r: 4 }}
                                        animationDuration={1500}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Bar Chart: Hourly Activity */}
                        <div className="bg-white rounded-2xl p-6 border border-slate-200">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-slate-900">Hourly Activity</h4>
                                <span className="text-xs text-slate-500">Last 12 hours</span>
                            </div>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={hourlyData}>
                                    <XAxis dataKey="hour" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: '#1e293b', 
                                            border: 'none', 
                                            borderRadius: '12px',
                                            color: '#fff'
                                        }}
                                    />
                                    <Bar dataKey="activity" fill="#8b5cf6" radius={[8, 8, 0, 0]} animationDuration={1500}>
                                        {hourlyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === hourlyData.length - 1 ? '#06b6d4' : '#8b5cf6'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Activity Feed */}
                    <div className="bg-slate-50 p-8 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-cyan-600" />
                                Live Activity Feed
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>Updated in real-time</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {activities.map((activity, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.3, delay: i * 0.1 }}
                                    className="flex items-center gap-4 bg-white rounded-xl p-4 border border-slate-200 hover:shadow-md transition-shadow"
                                >
                                    <div className="text-2xl">{activity.icon}</div>
                                    <div className="flex-1">
                                        <p className={`text-sm font-semibold ${activity.color}`}>{activity.text}</p>
                                        <span className="text-xs text-slate-500">{activity.time}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Tech Specs */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
                >
                    {[
                        { label: 'Events/Day', value: '2.5M+' },
                        { label: 'Query Latency', value: '< 500ms' },
                        { label: 'Data Retention', value: '1 Year' },
                        { label: 'Export Formats', value: 'CSV/JSON' }
                    ].map((spec, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                            <div className="text-3xl font-bold text-white mb-2">{spec.value}</div>
                            <div className="text-sm text-slate-400">{spec.label}</div>
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
