'use client';

import PrizeModal from '@/components/PrizeModal';
import SpinWheel from '@/components/SpinWheel_V2';
import { soundEffects } from '@/lib/soundEffects';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import EarnMoreSpinsCard from '../../shared/EarnMoreSpinsCard';

interface HeroProps {
    section: any;
    campaign: any;
    userId?: string | null;
}

export default function Template5Hero({ section, campaign, userId }: HeroProps) {
    // Template 5 primary color from reference HTML
    const primaryColor = '#FF0800';
    const [userStatus, setUserStatus] = useState<any>(null);
    // social tasks handled by shared EarnMoreSpinsCard
    const [prizes, setPrizes] = useState<any[]>([]);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [wonPrize, setWonPrize] = useState<any>(null);
    const [pendingPrize, setPendingPrize] = useState<any>(null);
    const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | undefined>(undefined);

    const content = section?.content || {};
    const headline = content.headline || campaign?.name || 'Spin to Win: Your Exclusive Brand Giveaway!';
    const subheadline = content.subheadline || campaign?.description || 'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products. High-tech rewards for modern professionals.';
    const buttonText = content.buttonText || 'SPIN THE WHEEL NOW';

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

    // no-op: EarnMoreSpinsCard will fetch and render tasks

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

        // Start visual spin immediately
        setPendingPrize(null);
        setSelectedPrizeIndex(undefined);
        setIsSpinning(true);
        soundEffects.playSpinSound();

        try {
            const response = await axios.post('/api/spin', {
                userId, campaignId: campaign.id,
                isReferralBonus: userStatus?.baseSpinsAvailable === 0 && userStatus?.bonusSpinsAvailable > 0
            });
            const prize = response.data.prize;
            const tryAgain = response.data.tryAgain === true;
            setPendingPrize({ ...prize, tryAgain });
            const idx = prizes.findIndex(p => p.id === prize.id);
            setSelectedPrizeIndex(idx >= 0 ? idx : undefined);
        } catch (error: any) {
            console.error('Spin error:', error);
            setIsSpinning(false);
            soundEffects.stopSpinSound();
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
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [primaryColor, '#000000', '#ffffff'] });
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
            <section className="w-full max-w-[1200px] mx-auto px-6 py-12 md:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                        <div className="relative w-72 h-72 md:w-[420px] md:h-[420px]">
                            {prizes.length > 0 ? (
                                <SpinWheel
                                    prizes={prizes}
                                    onFinished={handleSpinFinished}
                                    isSpinning={isSpinning}
                                    selectedPrizeIndex={selectedPrizeIndex}
                                    onTick={soundEffects.playTickSound}
                                    templateName="template_5"
                                    onSpinClick={startSpin}
                                    disabled={isSpinning || !userStatus?.canSpin}
                                    logoUrl={campaign?.logoUrl}
                                />
                            ) : (
                                <div className="relative w-full h-full rounded-full border-[12px] border-black dark:border-template5-primary/20 shadow-2xl flex items-center justify-center overflow-hidden spin-wheel-gradient-template-5">
                                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                                    <button
                                        onClick={startSpin}
                                        disabled={isSpinning || !userStatus?.canSpin}
                                        className="z-10 bg-white dark:bg-black w-20 h-20 md:w-32 md:h-32 rounded-full shadow-2xl flex items-center justify-center border-4 border-black dark:border-template5-primary cursor-pointer hover:scale-110 transition-transform disabled:opacity-50"
                                    >
                                        <span className="text-template5-primary font-black text-lg md:text-2xl tracking-tighter">SPIN</span>
                                    </button>
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-white z-20"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                            <div className="inline-flex items-center rounded-sm bg-black px-3 py-1 text-white text-[10px] font-black uppercase tracking-[0.2em] w-fit">
                                Live Campaign
                            </div>
                            <h1 className="text-black text-4xl md:text-7xl font-black leading-none tracking-tighter uppercase">
                                {headline.split(' ').map((word: string, idx: number) => {
                                    const isHighlight = word.toLowerCase().includes('rewards') || word.toLowerCase().includes('exclusive');
                                    return (
                                        <span key={idx} className={isHighlight ? 'text-template5-primary' : ''}>
                                            {word}{' '}
                                        </span>
                                    );
                                })}
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 text-xl leading-relaxed max-w-[550px]">{subheadline}</p>
                            <div className="mt-4 flex items-center gap-4">
                                <button
                                    onClick={startSpin}
                                    disabled={isSpinning || (userStatus !== null && !userStatus?.canSpin)}
                                    className="flex min-w-[240px] max-w-[320px] cursor-pointer items-center justify-center overflow-hidden rounded-none h-16 px-8 bg-template5-primary text-white text-xl font-black uppercase tracking-widest shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <span className="truncate">{isSpinning ? 'Spinning...' : buttonText || 'Spin the Wheel'}</span>
                                </button>
                                {/* Spins Remaining Badge */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-white dark:bg-black px-6 py-3.5 rounded-full shadow-2xl border-2 border-template5-primary flex items-center gap-3 overflow-visible"
                                >
                                    <span className="material-symbols-outlined flex-shrink-0 text-template5-primary fill-1" style={{ fontSize: '24px' }}>toll</span>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <span className="text-[10px] uppercase font-bold leading-tight whitespace-nowrap text-gray-500">Spin Remaining</span>
                                        <span className="text-xl font-black leading-none mt-0.5 whitespace-nowrap text-black dark:text-white">
                                            {userStatus?.totalAvailable?.toString().padStart(2, '0') || '02'}
                                        </span>
                                    </div>
                                </motion.div>
                                {/* Joined Users Badge */}
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 }}
                                    className="bg-white dark:bg-black px-6 py-3.5 rounded-full shadow-2xl border-2 border-template5-primary flex items-center gap-3 overflow-visible"
                                >
                                    <span className="material-symbols-outlined flex-shrink-0 text-template5-primary fill-1" style={{ fontSize: '24px' }}>group</span>
                                    <div className="flex flex-col justify-center min-w-0">
                                        <span className="text-[10px] uppercase font-bold leading-tight whitespace-nowrap text-gray-500">Joined Users</span>
                                        <span className="text-xl font-black leading-none mt-0.5 whitespace-nowrap text-black dark:text-white">
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
                            <EarnMoreSpinsCard
                                campaignId={campaign?.id}
                                userId={userId}
                                variant="light"
                                referralThreshold={referralsRequired}
                                onTaskComplete={() => {
                                    if (userId && campaign?.id) {
                                        axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                                            .then(res => setUserStatus(res.data))
                                            .catch(() => {});
                                    }
                                }}
                            />
                        </motion.div>
                    </div>
                </div>
            </section>


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
