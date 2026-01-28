'use client';

import { TaskInstructionModal } from '@/components/social/TaskInstructionModal';
import axios from 'axios';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface HeroSectionProps {
    section: any;
    campaign: any;
    brandColor: string;
    template?: string;
    userId?: string | null;
}

export default function HeroSection({ section, campaign, brandColor, template = 'template_1', userId }: HeroSectionProps) {
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);

    const content = section.content || {};
    const headline = content.headline || campaign?.name || 'Spin to Win!';
    const subheadline = content.subheadline || campaign?.description || 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products.';
    const buttonText = content.buttonText || 'Spin the Wheel Now';

    // Get campaign URL - add ?spin=true to bypass landing page and go to spin wheel
    const tenantSlug = campaign?.tenant?.slug || 'default';
    const campaignUrl = `/?tenant=${tenantSlug}&spin=true`;

    // Use brand color or default orange
    const primaryColor = brandColor || '#f48c25';

    const referralsRequired = campaign?.referralsRequiredForSpin ?? 0;

    const fetchSocialTasks = () => {
        if (campaign?.id) {
            axios.get(`/api/social-tasks?campaignId=${campaign.id}${userId ? `&userId=${userId}` : ''}`)
                .then(res => setSocialTasks(res.data.tasks || []))
                .catch(() => {});
        }
    };

    useEffect(() => {
        fetchSocialTasks();
    }, [campaign?.id, userId]);

    const handleTaskClick = (task: any) => {
        if (!userId) { 
            alert('Please log in');
            return; 
        }
        setSelectedTask(task);
    };

    return (
        <section className="w-full bg-[#f8f7f5] dark:bg-[#221910] py-12 md:py-20 transition-colors duration-300">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    {/* Left: Spin Wheel (5 columns) */}
                    <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                        {/* Spins Remaining Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute -top-4 z-30 bg-white dark:bg-[#1e293b] px-6 py-3 rounded-full shadow-xl border-2 flex items-center gap-3"
                            style={{ borderColor: primaryColor }}
                        >
                            <span className="text-2xl">🎰</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-[#8a7560] dark:text-gray-400 leading-none">
                                    Spins Remaining
                                </span>
                                <span className="text-xl font-black text-[#181411] dark:text-white leading-none">
                                    02
                                </span>
                            </div>
                        </motion.div>

                        {/* Spin Wheel */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="relative w-72 h-72 md:w-[400px] md:h-[400px] rounded-full border-8 shadow-2xl flex items-center justify-center overflow-hidden group"
                            style={{
                                borderColor: '#1e293b',
                                background: `conic-gradient(
                                    ${primaryColor} 0deg 45deg,
                                    #1e293b 45deg 90deg,
                                    ${primaryColor} 90deg 135deg,
                                    #334155 135deg 180deg,
                                    ${primaryColor} 180deg 225deg,
                                    #1e293b 225deg 270deg,
                                    ${primaryColor} 270deg 315deg,
                                    #475569 315deg 360deg
                                )`,
                            }}
                        >
                            {/* Dot pattern overlay */}
                            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                            
                            {/* Center button */}
                            <div 
                                className="z-10 bg-white dark:bg-[#1e293b] w-20 h-20 md:w-28 md:h-28 rounded-full shadow-xl flex items-center justify-center border-4 cursor-pointer hover:scale-105 transition-transform"
                                style={{ borderColor: '#1e293b' }}
                            >
                                <span 
                                    className="font-black text-lg md:text-xl tracking-tighter"
                                    style={{ color: primaryColor }}
                                >
                                    SPIN
                                </span>
                            </div>

                            {/* Pointer arrow */}
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20"></div>
                        </motion.div>

                        {/* Call to action text */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-8 flex items-center gap-2 font-bold animate-pulse"
                            style={{ color: primaryColor }}
                        >
                            <span className="text-xl">✨</span>
                            <span>Click to win prizes up to $500!</span>
                        </motion.div>
                    </div>

                    {/* Right: Content (7 columns) */}
                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <motion.div
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-col gap-4"
                        >
                            {/* Badge */}
                            <div 
                                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider w-fit"
                                style={{ 
                                    backgroundColor: `${primaryColor}1a`,
                                    color: primaryColor 
                                }}
                            >
                                Limited Time Campaign
                            </div>

                            {/* Headline */}
                            <h1 className="text-[#181411] dark:text-white text-5xl md:text-6xl font-black leading-tight tracking-[-0.033em]">
                                {headline.split(' ').map((word: string, idx: number) => {
                                    const isHighlight = word.toLowerCase().includes('brand') || word.toLowerCase().includes('exclusive') || word.toLowerCase().includes('giveaway');
                                    return (
                                        <span key={idx} style={isHighlight ? { color: primaryColor } : {}}>
                                            {word}{' '}
                                        </span>
                                    );
                                })}
                            </h1>

                            {/* Subheadline */}
                            <p className="text-[#8a7560] dark:text-gray-400 text-lg leading-relaxed max-w-[500px]">
                                {subheadline}
                            </p>

                            {/* CTA Button */}
                            <Link href={campaignUrl}>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="mt-4 flex min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 text-lg font-bold shadow-lg transition-all"
                                    style={{
                                        backgroundColor: primaryColor,
                                        color: 'white',
                                    }}
                                >
                                    <span className="truncate">{buttonText}</span>
                                </motion.button>
                            </Link>
                        </motion.div>

                        {/* Earn More Spins Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-[#2c221a] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 dark:border-gray-800"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                                <div className="flex flex-col">
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <span style={{ color: primaryColor }}>🎁</span>
                                        Earn More Spins
                                    </h3>
                                    <p className="text-[#8a7560] dark:text-gray-400 text-sm">
                                        Boost your chances by completing simple tasks below.
                                    </p>
                                </div>
                                {/* Social proof avatars */}
                                <div className="flex -space-x-3">
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300"></div>
                                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400"></div>
                                    <div 
                                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        +50k
                                    </div>
                                </div>
                            </div>

                            {/* Social Tasks Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                {socialTasks.length > 0 ? (
                                    socialTasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-[#f8f7f5] dark:bg-[#221910] border border-gray-100 dark:border-gray-700">
                                            <div className="flex flex-col">
                                                <span 
                                                    className="text-xs font-bold uppercase tracking-tighter"
                                                    style={{ color: primaryColor }}
                                                >
                                                    Social Bonus
                                                </span>
                                                <span className="font-bold text-sm text-[#181411] dark:text-white">
                                                    {task.title}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleTaskClick(task)}
                                                className="h-9 px-4 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-2"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                +{task.spinsReward || 1} Spin
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-between p-4 rounded-xl bg-[#f8f7f5] dark:bg-[#221910] border border-gray-100 dark:border-gray-700 opacity-50">
                                        <div className="flex flex-col">
                                            <span 
                                                className="text-xs font-bold uppercase tracking-tighter"
                                                style={{ color: primaryColor }}
                                            >
                                                Social Bonus
                                            </span>
                                            <span className="font-bold text-sm text-[#181411] dark:text-white">No active tasks</span>
                                        </div>
                                    </div>
                                )}

                                {referralsRequired > 0 && (
                                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#f8f7f5] dark:bg-[#221910] border border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[#25D366] uppercase tracking-tighter">
                                                    Referral Power
                                                </span>
                                                <span className="font-bold text-sm text-[#181411] dark:text-white">
                                                    Invite Friends
                                                </span>
                                            </div>
                                            <div className="bg-[#25D366]/10 text-[#25D366] px-2 py-1 rounded text-[10px] font-black uppercase">
                                                +1 Spin
                                            </div>
                                        </div>
                                        <button className="w-full h-10 rounded-lg bg-[#25D366] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all">
                                            <span className="material-symbols-outlined !text-[18px]">share</span>
                                            Share on WhatsApp
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {selectedTask && userId && campaign?.id && (
                <TaskInstructionModal
                    task={selectedTask}
                    userId={userId}
                    campaignId={campaign.id}
                    onClose={() => setSelectedTask(null)}
                    onComplete={() => {
                        setSelectedTask(null);
                        fetchSocialTasks();
                    }}
                />
            )}
        </section>
    );
}
