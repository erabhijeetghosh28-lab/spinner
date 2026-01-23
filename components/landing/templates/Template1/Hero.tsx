'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { TaskInstructionModal } from '@/components/social/TaskInstructionModal';
import SpinWheel from '@/components/SpinWheel';
import PrizeModal from '@/components/PrizeModal';
import { soundEffects } from '@/lib/soundEffects';
import confetti from 'canvas-confetti';

interface HeroProps {
    section: any;
    campaign: any;
    userId?: string | null;
}

export default function Template1Hero({ section, campaign, userId }: HeroProps) {
    // Template 1 primary color from reference HTML
    const primaryColor = '#f48c25';
    const [userStatus, setUserStatus] = useState<{
        totalAvailable: number;
        referralsProgress: number;
        referralsRequired: number;
        canSpin: boolean;
    } | null>(null);
    const [socialTasks, setSocialTasks] = useState<any[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [prizes, setPrizes] = useState<any[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [wonPrize, setWonPrize] = useState<any>(null);
    const [pendingPrize, setPendingPrize] = useState<any>(null);
    const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | undefined>(undefined);
    const [tryAgainMessage, setTryAgainMessage] = useState<string | null>(null);

    const content = section?.content || {};
    const headline = content.headline || campaign?.name || 'Spin to Win: Your Exclusive Brand Giveaway!';
    const subheadline = content.subheadline || campaign?.description || 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products. Out of spins? Invite friends to keep playing!';
    const buttonText = content.buttonText || 'Spin the Wheel Now';

    // Get prizes from campaign prop (already fetched by API)
    useEffect(() => {
        if (campaign?.prizes) {
            setPrizes(campaign.prizes);
        }
    }, [campaign?.prizes]);

    // Fetch user status
    useEffect(() => {
        if (userId && campaign?.id) {
            axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                .then(res => {
                    setUserStatus(res.data);
                })
                .catch(err => {
                    console.error('Failed to fetch user status:', err);
                    // Set default status if fetch fails to allow button to work
                    setUserStatus({
                        canSpin: true,
                        totalAvailable: 2,
                        referralsProgress: 0,
                        referralsRequired: 5
                    } as any);
                });
        } else {
            // If no userId, set null to show default "02" but allow button click (will prompt login)
            setUserStatus(null);
        }
    }, [userId, campaign?.id]);

    // Fetch social tasks
    useEffect(() => {
        if (campaign?.id) {
            axios.get(`/api/social-tasks?campaignId=${campaign.id}${userId ? `&userId=${userId}` : ''}`)
                .then(res => setSocialTasks(res.data.tasks || []))
                .catch(err => console.error('Failed to fetch social tasks:', err));
        }
    }, [campaign?.id, userId]);

    const handleTaskClick = (task: any) => {
        if (!userId) {
            alert('Please log in to complete social tasks');
            return;
        }
        setSelectedTask(task);
    };

    const handleWhatsAppShare = () => {
        if (!userId) {
            alert('Please log in to share');
            return;
        }
        const shareText = `Check out this amazing campaign! ${window.location.href}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
    };

    const startSpin = async () => {
        if (isSpinning) return;

        if (!userId) {
            alert('Please log in to spin the wheel!');
            return;
        }

        if (userStatus && !userStatus.canSpin) {
            const waitMsg = (userStatus as any).nextSpinInHours > 0 ? ` Wait ${(userStatus as any).nextSpinInHours}h or invite friends to unlock a bonus spin.` : ' Invite friends to unlock a bonus spin.';
            alert(`You've used all available spins.${waitMsg}`);
            return;
        }

        setWonPrize(null);
        setTryAgainMessage(null);

        try {
            const isUsingBonus = userStatus && (userStatus as any).baseSpinsAvailable === 0 && (userStatus as any).bonusSpinsAvailable > 0;

            const response = await axios.post('/api/spin', {
                userId: userId,
                campaignId: campaign.id,
                isReferralBonus: isUsingBonus
            });

            const prize = response.data.prize;
            const prizeIndex = prizes.findIndex(p => p.id === prize.id);
            const isTryAgain = response.data.tryAgain === true;

            setPendingPrize({
                ...prize,
                tryAgain: isTryAgain,
                message: response.data.message
            });
            setSelectedPrizeIndex(prizeIndex >= 0 ? prizeIndex : undefined);
            setTryAgainMessage(isTryAgain ? (response.data.message || 'Sorry, try again in some time') : null);

            setIsSpinning(true);
            soundEffects.playSpinSound();
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 403) {
                alert(error.response?.data?.error || 'You have no spins available');
            } else if (status === 429) {
                alert(error.response?.data?.error || 'Please wait before spinning again');
            } else {
                alert(error.response?.data?.error || 'Failed to spin. Please try again.');
            }
        }
    };

    const handleSpinFinished = async (resultPrize?: any) => {
        setIsSpinning(false);
        soundEffects.stopSpinSound();

        const finalPrize = resultPrize || pendingPrize;

        if (finalPrize && userId) {
            const isLoss = finalPrize.tryAgain ||
                finalPrize.name.toLowerCase().includes('no prize') ||
                finalPrize.name.toLowerCase().includes('no offer');

            setWonPrize(finalPrize);
            setPendingPrize(null);
            setSelectedPrizeIndex(undefined);

            if (!isLoss) {
                soundEffects.playWinSound();
                if (typeof navigator !== 'undefined' && navigator.vibrate) {
                    navigator.vibrate([100, 50, 100, 50, 200]);
                }

                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: [primaryColor, '#1e3a8a', '#ffffff']
                });
            }

            // Refresh user status
            if (userId && campaign?.id) {
                axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                    .then(res => setUserStatus(res.data))
                    .catch(err => console.error('Failed to refresh user status:', err));
            }

            setShowPrizeModal(true);
        }
    };

    const referralsProgress = userStatus?.referralsProgress || 0;
    const referralsRequired = userStatus?.referralsRequired || campaign?.referralsForBonus || 5;
    const referralPercentage = referralsRequired > 0 ? (referralsProgress / referralsRequired) * 100 : 0;

    return (
        <>
            <section className="w-full max-w-[1200px] mx-auto px-6 py-12 md:py-20">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                        {/* Left: Spin Wheel (5 columns) */}
                        <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                            {/* Functional Spin Wheel - matches reference exactly */}
                            <div className="relative w-72 h-72 md:w-[400px] md:h-[400px]">
                                {prizes.length > 0 ? (
                                    <SpinWheel
                                        prizes={prizes}
                                        onFinished={handleSpinFinished}
                                        isSpinning={isSpinning}
                                        selectedPrizeIndex={selectedPrizeIndex}
                                        onTick={soundEffects.playTickSound}
                                        templateName="template_1"
                                        onSpinClick={startSpin}
                                        disabled={isSpinning || !userStatus?.canSpin}
                                    />
                                ) : (
                                    <div className="relative w-full h-full rounded-full border-8 border-[#1e293b] shadow-2xl flex items-center justify-center overflow-hidden group"
                                        style={{
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
                                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                                        <button
                                            onClick={startSpin}
                                            disabled={isSpinning || !userStatus?.canSpin}
                                            className="z-10 bg-white w-20 h-20 md:w-28 md:h-28 rounded-full shadow-xl flex items-center justify-center border-4 border-[#1e293b] cursor-pointer hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="font-black text-lg md:text-xl tracking-tighter" style={{ color: primaryColor }}>SPIN</span>
                                        </button>
                                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20"></div>
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* Right: Content (7 columns) */}
                        <div className="lg:col-span-7 flex flex-col gap-8">
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col gap-4"
                            >
                                <div 
                                    className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider w-fit"
                                    style={{ color: primaryColor }}
                                >
                                    Limited Time Campaign
                                </div>
                                <h1 className="text-[#181411] text-5xl md:text-6xl font-black leading-tight tracking-[-0.033em]">
                                    {headline.split(' ').map((word: string, idx: number) => {
                                        const isHighlight = word.toLowerCase().includes('brand') || word.toLowerCase().includes('exclusive') || word.toLowerCase().includes('giveaway');
                                        return (
                                            <span key={idx} style={isHighlight ? { color: primaryColor } : {}}>
                                                {word}{' '}
                                            </span>
                                        );
                                    })}
                                </h1>
                                <p className="text-[#8a7560] text-lg leading-relaxed max-w-[500px]">
                                    {subheadline}
                                </p>
                                <div className="mt-4 flex items-center gap-4">
                                    <button 
                                        onClick={startSpin}
                                        disabled={isSpinning || (userStatus !== null && !userStatus?.canSpin)}
                                        className="flex min-w-[200px] max-w-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-6 text-white text-lg font-bold shadow-lg hover:shadow-primary/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                        style={{ backgroundColor: primaryColor }}
                                    >
                                        <span className="truncate">{isSpinning ? 'Spinning...' : buttonText}</span>
                                    </button>
                                    {/* Spins Remaining Badge */}
                                    <motion.div 
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="bg-white px-6 py-3.5 rounded-full shadow-xl border-2 flex items-center gap-3 overflow-visible"
                                        style={{ borderColor: primaryColor }}
                                    >
                                        <span className="material-symbols-outlined flex-shrink-0" style={{ color: primaryColor, fontSize: '24px' }}>toll</span>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <span className="text-[10px] uppercase font-bold leading-tight whitespace-nowrap" style={{ color: '#8a7560' }}>Spins Remaining</span>
                                            <span className="text-2xl font-black leading-none mt-0.5 whitespace-nowrap" style={{ color: '#181411' }}>
                                                {userStatus?.totalAvailable?.toString().padStart(2, '0') || '02'}
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>

                            {/* Earn More Spins Card */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-gray-100"
                            >
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                                    <div className="flex flex-col">
                                        <h3 className="text-xl font-black flex items-center gap-2 text-[#181411]">
                                            <span className="material-symbols-outlined" style={{ color: primaryColor }}>redeem</span>
                                            Earn More Spins
                                        </h3>
                                        <p className="text-[#8a7560] text-sm">Boost your chances by completing simple tasks below.</p>
                                    </div>
                                </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                        {/* Social Tasks - Show all tasks in a scrollable grid if more than 1 */}
                                        {socialTasks.length > 0 ? (
                                            socialTasks.length === 1 ? (
                                                // Single task - show as before
                                                socialTasks.map((task) => (
                                                    <div key={task.id} className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-gray-100">
                                                        <div className="flex flex-col">
                                                            <span 
                                                                className="text-xs font-bold uppercase tracking-tighter"
                                                                style={{ color: primaryColor }}
                                                            >
                                                                Social Bonus
                                                            </span>
                                                            <span className="font-bold text-sm text-[#181411]">{task.title}</span>
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
                                                // Multiple tasks - show in a scrollable horizontal carousel
                                                <div className="md:col-span-2">
                                                    <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-2">
                                                        {socialTasks.map((task) => (
                                                            <div key={task.id} className="flex-none w-[280px] snap-center">
                                                                <div className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-gray-100">
                                                                    <div className="flex flex-col">
                                                                        <span 
                                                                            className="text-xs font-bold uppercase tracking-tighter"
                                                                            style={{ color: primaryColor }}
                                                                        >
                                                                            Social Bonus
                                                                        </span>
                                                                        <span className="font-bold text-sm text-[#181411]">{task.title}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleTaskClick(task)}
                                                                        className="h-9 px-4 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-2 whitespace-nowrap"
                                                                        style={{ backgroundColor: primaryColor }}
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
                                            // Show placeholder if no tasks
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-background-light border border-gray-100 opacity-50">
                                                <div className="flex flex-col">
                                                    <span 
                                                        className="text-xs font-bold uppercase tracking-tighter"
                                                        style={{ color: primaryColor }}
                                                    >
                                                        Social Bonus
                                                    </span>
                                                    <span className="font-bold text-sm text-[#181411]">No tasks available</span>
                                                </div>
                                            </div>
                                        )}

                                    {/* Referral Power Card */}
                                    <div className="flex flex-col gap-3 p-4 rounded-xl bg-background-light border border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-[#25D366] uppercase tracking-tighter">Referral Power</span>
                                                <span className="font-bold text-sm text-[#181411]">Invite {referralsRequired} friends</span>
                                            </div>
                                            <div className="bg-[#25D366]/10 text-[#25D366] px-2 py-1 rounded text-[10px] font-black uppercase">
                                                +1 Spin
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleWhatsAppShare}
                                            className="w-full h-10 rounded-lg bg-[#25D366] text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
                                        >
                                            <span className="material-symbols-outlined !text-[18px]">share</span>
                                            Share on WhatsApp
                                        </button>
                                        <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden mt-1">
                                            <div 
                                                className="bg-[#25D366] h-full transition-all"
                                                style={{ width: `${Math.min(referralPercentage, 100)}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-[10px] text-center text-[#8a7560]">
                                            {referralsProgress}/{referralsRequired} friends invited
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

            {/* Task Instruction Modal */}
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
                                .catch(err => console.error('Failed to refresh user status:', err));
                        }
                    }}
                />
            )}

            {/* Prize Modal */}
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
