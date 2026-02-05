'use client';

import { PLATFORM_NAME } from '@/lib/constants';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Prize {
    id: string;
    name: string;
    voucherValidityDays: number;
    voucherRedemptionLimit: number;
}

interface SocialTask {
    id: string;
    platform: string;
    actionType: string;
    title: string;
    spinsReward: number;
}

interface Campaign {
    id: string;
    name: string;
    description: string;
    rulesText?: string;
    autoGenerateRules: boolean;
    spinLimit: number;
    spinCooldown: number;
    referralsRequiredForSpin: number;
}

export default function CampaignRulesPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [prizes, setPrizes] = useState<Prize[]>([]);
    const [socialTasks, setSocialTasks] = useState<SocialTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axios.get(`/api/campaigns?tenantSlug=${slug}`);
                setCampaign(res.data.campaign);
                setPrizes(res.data.prizes || []);
                setSocialTasks(res.data.socialTasks || []);
            } catch (err) {
                console.error('Error fetching rules data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (slug) fetchData();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-amber-500"></div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Campaign Not Found</h1>
                    <button 
                        onClick={() => router.push(`/${slug}`)}
                        className="text-amber-500 hover:underline uppercase text-xs font-black tracking-widest"
                    >
                        Back to Campaign
                    </button>
                </div>
            </div>
        );
    }

    const renderGeneratedRules = () => {
        return (
            <div className="space-y-8">
                <section>
                    <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4">1. Participation</h2>
                    <ul className="space-y-3 text-slate-400 text-sm leading-relaxed list-disc pl-5">
                        <li>Each user is allowed a maximum of <span className="text-white font-bold">{campaign.spinLimit}</span> spin(s) per session.</li>
                        <li>A cooldown period of <span className="text-white font-bold">{campaign.spinCooldown} hours</span> applies between spins after the limit is reached.</li>
                        {campaign.referralsRequiredForSpin > 0 && (
                            <li>Users must successfully refer <span className="text-white font-bold">{campaign.referralsRequiredForSpin} friends</span> to unlock additional bonus spins.</li>
                        )}
                        <li>Participants must be verified via a valid WhatsApp-linked phone number.</li>
                    </ul>
                </section>section

                <section>
                    <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4">2. Rewards & Validity</h2>
                    <div className="space-y-4">
                        {prizes.filter(p => !p.name.toLowerCase().includes('try again')).map((prize, idx) => (
                            <div key={prize.id} className="p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                                <h3 className="text-white font-bold text-sm mb-1">{prize.name}</h3>
                                <div className="flex flex-wrap gap-4 text-[10px] uppercase font-bold tracking-wider">
                                    <span className="text-slate-500">Validity: <span className="text-amber-500">{prize.voucherValidityDays} Days</span></span>
                                    <span className="text-slate-500">Redemption Limit: <span className="text-amber-500">{prize.voucherRedemptionLimit} Use(s)</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {socialTasks.length > 0 && (
                    <section>
                        <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4">3. Bonus Spin Tasks</h2>
                        <p className="text-slate-400 text-sm mb-4 italic">Complete following tasks to earn extra spins:</p>
                        <ul className="space-y-3 text-slate-400 text-sm leading-relaxed">
                            {socialTasks.map((task) => (
                                <li key={task.id} className="flex justify-between items-center p-3 border-b border-white/5 last:border-0">
                                    <span className="text-white font-medium">{task.title}</span>
                                    <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded font-black tracking-widest">{task.spinsReward} EXTRA SPIN(S)</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section>
                    <h2 className="text-amber-500 text-xs font-black uppercase tracking-[0.2em] mb-4">4. General Terms</h2>
                    <ul className="space-y-3 text-slate-400 text-sm leading-relaxed list-disc pl-5">
                        <li>The campaign is organized by <span className="text-white font-bold">{campaign.name}</span>.</li>
                        <li>Automated entries or use of bots will lead to immediate disqualification.</li>
                        <li>The brand reserves the right to cancel or amend the campaign and these terms and conditions without notice.</li>
                        <li>Prizes are non-transferable and cannot be exchanged for cash.</li>
                    </ul>
                </section>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white relative py-20 px-6">
            {/* Premium Mesh Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] bg-blue-600/5 rounded-full blur-[150px]"></div>
            </div>

            <div className="max-w-2xl mx-auto relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-12 text-center"
                >
                    <button 
                        onClick={() => router.push(`/${slug}`)}
                        className="inline-flex items-center gap-2 text-slate-500 hover:text-white mb-8 transition-colors group"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Back to Spin Wheel</span>
                    </button>
                    <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase italic text-white leading-none">
                        Campaign <span className="text-amber-500">Rules</span>
                    </h1>
                    <p className="text-slate-400 text-sm font-medium">Terms and Conditions for participating in the <span className="text-white font-bold italic">"{campaign.name}"</span></p>
                </motion.div>

                <div className="bg-slate-900/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10 shadow-2xl">
                    {campaign.autoGenerateRules ? (
                        renderGeneratedRules()
                    ) : (
                        <div className="prose prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-slate-400 text-sm leading-relaxed">
                                {campaign.rulesText}
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">{PLATFORM_NAME}</p>
                </div>
            </div>
        </div>
    );
}
