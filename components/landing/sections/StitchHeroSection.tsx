'use client';

import { TaskInstructionModal } from '@/components/social/TaskInstructionModal';
import axios from 'axios';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface StitchHeroSectionProps {
    campaign: any;
    primaryColor?: string;
    userId?: string | null;
}

export default function StitchHeroSection({ campaign, primaryColor = '#f48c25', userId }: StitchHeroSectionProps) {
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);

    // Determine campaign URL
    const tenantSlug = campaign?.tenant?.slug || 'default';
    const campaignUrl = `/?tenant=${tenantSlug}&spin=true`;

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
        <section className="w-full max-w-[1200px] px-6 py-12 md:py-20 mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Column: Spin Wheel Visualization */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                    {/* Spins Remaining Badge */}
                    <div className="absolute -top-4 z-30 bg-white dark:bg-[#1e293b] px-6 py-3 rounded-full shadow-xl border-2 flex items-center gap-3" style={{ borderColor: primaryColor }}>
                        <span className="material-symbols-outlined fill-1" style={{ color: primaryColor }}>toll</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-[#8a7560] dark:text-gray-400 leading-none">Spins Remaining</span>
                            <span className="text-xl font-black text-[#181411] dark:text-white leading-none">02</span>
                        </div>
                    </div>

                    {/* Wheel Graphic */}
                    <div className="relative w-72 h-72 md:w-[400px] md:h-[400px] rounded-full border-8 border-[#1e293b] dark:border-primary/30 shadow-2xl flex items-center justify-center overflow-hidden group">
                         <div className="absolute inset-0 w-full h-full" style={{
                            background: `conic-gradient(
                                ${primaryColor} 0deg 45deg,
                                #1e293b 45deg 90deg,
                                ${primaryColor} 90deg 135deg,
                                #334155 135deg 180deg,
                                ${primaryColor} 180deg 225deg,
                                #1e293b 225deg 270deg,
                                ${primaryColor} 270deg 315deg,
                                #475569 315deg 360deg
                            )`
                        }}></div>
                        
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        
                        <Link href={campaignUrl} className="z-10 bg-white dark:bg-[#1e293b] w-20 h-20 md:w-28 md:h-28 rounded-full shadow-xl flex items-center justify-center border-4 border-[#1e293b] dark:border-primary cursor-pointer hover:scale-105 transition-transform">
                            <span className="font-black text-lg md:text-xl tracking-tighter" style={{ color: primaryColor }}>SPIN</span>
                        </Link>
                        
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20"></div>
                    </div>

                    <div className="mt-8 flex items-center gap-2 font-bold animate-pulse" style={{ color: primaryColor }}>
                        <span className="material-symbols-outlined">auto_awesome</span>
                        <span>Click to win prizes up to $500!</span>
                    </div>
                </div>

                {/* Right Column: Content & interactions */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider w-fit" 
                             style={{ backgroundColor: `${primaryColor}1a`, color: primaryColor }}>
                            Limited Time Campaign
                        </div>
                        <h1 className="text-[#181411] dark:text-white text-5xl md:text-6xl font-black leading-tight tracking-[-0.033em]">
                            {campaign?.name ? (
                                <>
                                    {campaign.name.split(' ').slice(0, -2).join(' ')} <span style={{ color: primaryColor }}>{campaign.name.split(' ').slice(-2).join(' ')}</span>
                                </>
                            ) : (
                                <>Spin to Win: Your Exclusive <span style={{ color: primaryColor }}>Brand Giveaway!</span></>
                            )}
                        </h1>
                        <p className="text-[#8a7560] dark:text-gray-400 text-lg leading-relaxed max-w-[500px]">
                            {campaign?.description || "Take a spin on our prize wheel for a chance to win exclusive discounts and premium products. Out of spins? Invite friends to keep playing!"}
                        </p>
                        <Link href={campaignUrl} className="mt-4 flex min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 text-white text-lg font-bold shadow-lg hover:shadow-primary/40 transition-all active:scale-95" style={{ backgroundColor: primaryColor }}>
                            <span className="truncate">Spin the Wheel Now</span>
                        </Link>
                    </div>

                    {/* Integrated Social Tasks Card (Dynamic Preview for Landing) */}
                    <div className="flex flex-col gap-4 rounded-2xl bg-white dark:bg-[#2c221a] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <span className="material-symbols-outlined" style={{ color: primaryColor }}>redeem</span>
                                    Earn More Spins
                                </h3>
                                <p className="text-[#8a7560] dark:text-gray-400 text-sm">Boost your chances by completing simple tasks below.</p>
                            </div>
                            <div className="flex -space-x-3">
                                {/* Placeholders for social proof */}
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-300"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400"></div>
                                <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: primaryColor }}>+50k</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {socialTasks.length > 0 ? (
                                socialTasks.map((task) => (
                                    <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-[#f8f7f5] dark:bg-[#181411] border border-gray-100 dark:border-gray-700">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold uppercase tracking-tighter" style={{ color: primaryColor }}>Social Bonus</span>
                                            <span className="font-bold text-sm text-[#181411] dark:text-white">{task.title}</span>
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
                                <div className="flex items-center justify-between p-4 rounded-xl bg-[#f8f7f5] dark:bg-[#181411] border border-gray-100 dark:border-gray-700 opacity-50">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold uppercase tracking-tighter" style={{ color: primaryColor }}>Social Bonus</span>
                                        <span className="font-bold text-sm text-[#181411] dark:text-white">Visit & Earn</span>
                                    </div>
                                    <button className="h-9 px-4 rounded-lg text-white text-xs font-bold opacity-50 cursor-not-allowed" style={{ backgroundColor: primaryColor }}>
                                        Full
                                    </button>
                                </div>
                            )}

                             <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#f8f7f5] dark:bg-[#181411] border border-gray-100 dark:border-gray-700">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-xs font-bold text-[#25D366] uppercase tracking-tighter">Referral Power</span>
                                        <span className="font-bold text-sm text-[#181411] dark:text-white">Invite Friends</span>
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
                        </div>
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
