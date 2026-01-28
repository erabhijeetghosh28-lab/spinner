'use client';

import PrizeModal from '@/components/PrizeModal';
import { TaskInstructionModal } from '@/components/social/TaskInstructionModal';
import SpinWheel from '@/components/SpinWheel';
import { soundEffects } from '@/lib/soundEffects';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeroProps {
    section: any;
    campaign: any;
    userId?: string | null;
}

export default function Template3Hero({ section, campaign, userId }: HeroProps) {
    // Template 3 primary color from reference HTML
    const primaryColor = '#D4AF37';
    const [userStatus, setUserStatus] = useState<any>(null);
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [prizes, setPrizes] = useState<any[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [wonPrize, setWonPrize] = useState<any>(null);
    const [pendingPrize, setPendingPrize] = useState<any>(null);
    const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | undefined>(undefined);

    const content = section?.content || {};
    // Template 3 default headline from reference: "A Legacy of Excellence."
    const headline = content.headline || campaign?.name || 'A Legacy of Excellence.';
    const subheadline = content.subheadline || campaign?.description || 'Enter an exclusive realm of rewards. Spin our signature wheel for a chance to acquire curated luxury experiences and limited-edition items.';
    const buttonText = content.buttonText || 'Commence Spin';

    useEffect(() => {
        if (campaign?.prizes) setPrizes(campaign.prizes);
    }, [campaign?.prizes]);

    useEffect(() => {
        if (userId && campaign?.id) {
            axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                .then(res => setUserStatus(res.data))
                .catch(() => setUserStatus({ canSpin: true, totalAvailable: 2, referralsProgress: 0, referralsRequired: 5 }));
        } else {
            setUserStatus(null);
        }
    }, [userId, campaign?.id]);

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
        if (!userId) { alert('Please log in'); return; }
        setSelectedTask(task);
    };

    const handleWhatsAppShare = () => {
        if (!userId) { alert('Please log in'); return; }
        window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this campaign! ${window.location.href}`)}`, '_blank');
    };

    const startSpin = async () => {
        if (isSpinning || !userId) return;
        if (userStatus && !userStatus.canSpin) {
            alert('No spins available');
            return;
        }

        try {
            const response = await axios.post('/api/spin', {
                userId, campaignId: campaign.id,
                isReferralBonus: userStatus?.baseSpinsAvailable === 0 && userStatus?.bonusSpinsAvailable > 0
            });
            const prize = response.data.prize;
            setPendingPrize({ ...prize, tryAgain: response.data.tryAgain });
            setSelectedPrizeIndex(prizes.findIndex(p => p.id === prize.id));
            setIsSpinning(true);
            soundEffects.playSpinSound();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to spin');
        }
    };

    const handleSpinFinished = async (resultPrize?: any) => {
        setIsSpinning(false);
        soundEffects.stopSpinSound();
        const finalPrize = resultPrize || pendingPrize;
        if (finalPrize && userId) {
            setWonPrize(finalPrize);
            if (!finalPrize.tryAgain) {
                soundEffects.playWinSound();
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [primaryColor, '#C5A028', '#ffffff'] });
            }
            if (userId && campaign?.id) {
                axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                    .then(res => setUserStatus(res.data))
                    .catch(() => {});
            }
            setShowPrizeModal(true);
        }
    };

    const referralsProgress = userStatus?.referralsProgress || 0;
    const referralsRequired = userStatus?.referralsRequired ?? campaign?.referralsRequiredForSpin ?? 0;
    const referralPercentage = referralsRequired > 0 ? (referralsProgress / referralsRequired) * 100 : 0;

    return (
        <>
            <section className="w-full bg-white dark:bg-background-dark px-6 py-12 md:py-20 border-b border-template3-beige-light dark:border-white/5">
                <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                        <div className="relative w-72 h-72 md:w-[420px] md:h-[420px]">
                            {prizes.length > 0 ? (
                                <SpinWheel
                                    prizes={prizes}
                                    onFinished={handleSpinFinished}
                                    isSpinning={isSpinning}
                                    selectedPrizeIndex={selectedPrizeIndex}
                                    onTick={soundEffects.playTickSound}
                                    templateName="template_3"
                                    onSpinClick={startSpin}
                                    disabled={isSpinning || !userStatus?.canSpin}
                                />
                            ) : (
                                <div className="relative w-full h-full rounded-full border-[12px] border-template3-primary/20 dark:border-template3-primary/10 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex items-center justify-center overflow-hidden spin-wheel-gradient-template-3">
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,#D4AF37_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                                    <button
                                        onClick={startSpin}
                                        disabled={isSpinning || !userStatus?.canSpin}
                                        className="z-10 bg-white dark:bg-[#1A1612] w-24 h-24 md:w-32 md:h-32 rounded-full shadow-2xl flex items-center justify-center border-4 border-template3-primary cursor-pointer hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        <span className="text-template3-primary font-serif font-bold text-lg md:text-xl tracking-widest">SPIN</span>
                                    </button>
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-template3-primary z-20"></div>
                                </div>
                            )}
                        </div>
                        {/* Text below wheel */}
                        <div className="mt-8 flex items-center gap-2 text-template3-primary font-bold tracking-wide">
                            <span className="material-symbols-outlined !text-[20px]">workspace_premium</span>
                            <span className="font-serif uppercase text-sm">Unlock Grand Prizes up to $500</span>
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                            <div className="inline-flex items-center rounded-none bg-template3-primary/5 border border-template3-primary/20 px-4 py-1.5 text-template3-primary text-[10px] font-bold uppercase tracking-[0.2em] w-fit">
                                Privé Collection Event
                            </div>
                            <h1 className="text-[#181411] dark:text-white text-5xl md:text-7xl font-serif font-bold leading-[1.1] tracking-tight">
                                {headline.split(' ').map((word: string, idx: number) => {
                                    const wordLower = word.toLowerCase().replace(/[^\w]/g, ''); // Remove punctuation for comparison
                                    // Template 3 reference highlights "Excellence" in gold
                                    const isHighlight = wordLower.includes('excellence');
                                    return (
                                        <span 
                                            key={idx} 
                                            className={isHighlight ? 'text-template3-primary' : 'text-[#181411] dark:text-white'}
                                        >
                                            {word}{' '}
                                        </span>
                                    );
                                })}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed max-w-[550px]">{subheadline}</p>
                            <div className="mt-6 flex items-center gap-4">
                                <button
                                    onClick={startSpin}
                                    disabled={isSpinning || (userStatus !== null && !userStatus?.canSpin)}
                                    className="gold-shimmer flex min-w-[240px] max-w-[320px] cursor-pointer items-center justify-center overflow-hidden h-14 px-8 text-white text-sm font-bold uppercase tracking-widest shadow-xl hover:brightness-110 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="truncate">{isSpinning ? 'Spinning...' : buttonText || 'Commence Spin'}</span>
                                </button>
                                {/* Spins Left Badge - on right side of button */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white dark:bg-[#2C241D] px-8 py-3.5 rounded-none shadow-2xl border border-template3-primary flex items-center gap-4 overflow-visible"
                                >
                                    <span className="material-symbols-outlined flex-shrink-0 text-template3-primary fill-1" style={{ fontSize: '24px' }}>stars</span>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <span className="text-[10px] uppercase font-bold leading-tight whitespace-nowrap text-gray-400 dark:text-gray-500 tracking-widest">Spin Remaining</span>
                                        <span className="text-2xl font-serif font-black leading-none mt-0.5 whitespace-nowrap text-[#181411] dark:text-white">
                                            {userStatus?.totalAvailable?.toString().padStart(2, '0') || '02'}
                                        </span>
                                    </div>
                                </motion.div>
                                {/* Joined Users Badge */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-[#2C241D] px-8 py-3.5 rounded-none shadow-2xl border border-template3-primary flex items-center gap-4 overflow-visible"
                                >
                                    <span className="material-symbols-outlined flex-shrink-0 text-template3-primary fill-1" style={{ fontSize: '24px' }}>group</span>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <span className="text-[10px] uppercase font-bold leading-tight whitespace-nowrap text-gray-400 dark:text-gray-500 tracking-widest">Joined Users</span>
                                        <span className="text-2xl font-serif font-black leading-none mt-0.5 whitespace-nowrap text-[#181411] dark:text-white">
                                            {userStatus?.totalReferrals?.toString().padStart(2, '0') || '00'}
                                        </span>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.div 
                            initial={{ opacity: 0, y: 20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            transition={{ delay: 0.2 }} 
                            className="flex flex-col gap-4 rounded-none bg-[#FCFAF7] dark:bg-[#231F1B] p-8 shadow-sm border border-template3-beige-light dark:border-white/5"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-template3-primary/10 pb-6">
                                <div className="flex flex-col">
                                    <h3 className="text-lg font-serif font-bold flex items-center gap-2 uppercase tracking-wider text-[#181411] dark:text-white">
                                        <span className="material-symbols-outlined text-template3-primary">military_tech</span>
                                        Extend Your Access
                                    </h3>
                                    <p className="text-gray-400 dark:text-gray-500 text-sm italic">Enhance your opportunities through prestige networking.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                {socialTasks.length > 0 ? (
                                    socialTasks.length === 1 ? (
                                        socialTasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-5 bg-white dark:bg-background-dark border border-template3-beige-light dark:border-white/5">
                                                <div className="flex flex-col">
                                                    <span 
                                                        className="text-[10px] font-bold text-template3-primary uppercase tracking-[0.15em]"
                                                    >
                                                        Social Tier
                                                    </span>
                                                    <span className="font-bold text-sm text-[#181411] dark:text-white">{task.title}</span>
                                                </div>
                                                <button 
                                                    onClick={() => handleTaskClick(task)}
                                                    className="h-10 px-6 bg-template3-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-template3-gold-brushed transition-colors"
                                                >
                                                    +{task.spinsReward || 1} Spin
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="md:col-span-2">
                                            <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-2">
                                                {socialTasks.map((task) => (
                                                    <div key={task.id} className="flex-none w-[280px] snap-center">
                                                        <div className="flex items-center justify-between p-5 bg-white dark:bg-background-dark border border-template3-beige-light dark:border-white/5">
                                                            <div className="flex flex-col">
                                                                <span 
                                                                    className="text-[10px] font-bold text-template3-primary uppercase tracking-[0.15em]"
                                                                >
                                                                    Social Tier
                                                                </span>
                                                                <span className="font-bold text-sm text-[#181411] dark:text-white">{task.title}</span>
                                                            </div>
                                                            <button 
                                                                onClick={() => handleTaskClick(task)}
                                                                className="h-10 px-6 bg-template3-primary text-white text-[10px] font-bold uppercase tracking-widest hover:bg-template3-gold-brushed transition-colors whitespace-nowrap"
                                                            >
                                                                +{task.spinsReward || 1} Spin
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex items-center justify-between p-5 bg-white dark:bg-background-dark border border-template3-beige-light dark:border-white/5 opacity-50">
                                        <div className="flex flex-col">
                                            <span 
                                                className="text-[10px] font-bold text-template3-primary uppercase tracking-[0.15em]"
                                            >
                                                Social Tier
                                            </span>
                                            <span className="font-bold text-sm text-[#181411] dark:text-white">No tasks available</span>
                                        </div>
                                    </div>
                                )}

                                {referralsRequired > 0 && (
                                    <div className="flex flex-col gap-4 p-5 bg-white dark:bg-background-dark border border-template3-beige-light dark:border-white/5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-whatsapp uppercase tracking-[0.15em]">Ambassador Program</span>
                                                <span className="font-bold text-sm text-[#181411] dark:text-white">Invite {referralsRequired} Peers</span>
                                            </div>
                                            <div className="bg-whatsapp/5 text-whatsapp border border-whatsapp/20 px-2 py-1 text-[10px] font-bold uppercase tracking-tighter">
                                                +1 Spin
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleWhatsAppShare}
                                            className="w-full h-11 bg-whatsapp text-white text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">send</span>
                                            Share Invitation
                                        </button>
                                        <div className="w-full bg-gray-100 dark:bg-gray-800 h-1 mt-1">
                                            <div 
                                                className="bg-whatsapp h-full transition-all"
                                                style={{ width: `${Math.min(referralPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-center text-gray-500 dark:text-gray-400">
                                            {referralsProgress}/{referralsRequired} friends invited
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {selectedTask && userId && campaign?.id && (
                <TaskInstructionModal
                    task={selectedTask}
                    userId={userId}
                    campaignId={campaign.id}
                    onClose={() => setSelectedTask(null)}
                    onComplete={() => {
                        setSelectedTask(null);
                        if (userId && campaign?.id) {
                            axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                                .then(res => setUserStatus(res.data))
                                .catch(() => {});
                            
                            // Re-fetch social tasks to hide completed one
                            fetchSocialTasks();
                        }
                    }}
                />
            )}

            {showPrizeModal && wonPrize && (
                <PrizeModal
                    prize={wonPrize}
                    isOpen={showPrizeModal}
                    onClose={() => {
                        setShowPrizeModal(false);
                        setWonPrize(null);
                    }}
                />
            )}
        </>
    );
}
