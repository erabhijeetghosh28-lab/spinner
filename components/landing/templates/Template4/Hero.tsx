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

export default function Template4Hero({ section, campaign, userId }: HeroProps) {
    // Template 4 primary color from reference HTML
    const primaryColor = '#2D5A47';
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
    const accentColor = '#CD7F63';

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
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [primaryColor, accentColor, '#ffffff'] });
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
                        <div className="relative w-72 h-72 md:w-[400px] md:h-[400px]">
                            {prizes.length > 0 ? (
                                <SpinWheel
                                    prizes={prizes}
                                    onFinished={handleSpinFinished}
                                    isSpinning={isSpinning}
                                    selectedPrizeIndex={selectedPrizeIndex}
                                    onTick={soundEffects.playTickSound}
                                    templateName="template_4"
                                    logoUrl={campaign?.logoUrl}
                                />
                            ) : (
                                <div className="relative w-full h-full rounded-full border-8 border-template4-primary/20 dark:border-template4-primary/40 shadow-2xl flex items-center justify-center overflow-hidden spin-wheel-gradient-template-4">
                                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,#fff_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                                    <button
                                        onClick={startSpin}
                                        disabled={isSpinning || !userStatus?.canSpin}
                                        className="z-10 bg-white dark:bg-[#1A2421] w-20 h-20 md:w-28 md:h-28 rounded-full shadow-xl flex items-center justify-center border-4 border-template4-primary cursor-pointer hover:scale-105 transition-transform disabled:opacity-50"
                                    >
                                        <span className="text-template4-primary font-black text-lg md:text-xl tracking-tighter">SPIN</span>
                                    </button>
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-7 flex flex-col gap-8">
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4">
                            <div className="inline-flex items-center rounded-full bg-template4-primary/10 px-3 py-1 text-template4-primary text-xs font-bold uppercase tracking-wider w-fit">
                                Sustainable Campaign
                            </div>
                            <h1 className="text-template4-primary text-3xl md:text-6xl font-black leading-tight tracking-[-0.033em]">
                                {headline.split(' ').map((word: string, idx: number) => {
                                    const isHighlight = word.toLowerCase().includes('wellness') || word.toLowerCase().includes('choice');
                                    return (
                                        <span key={idx} className={isHighlight ? 'text-template4-accent' : ''}>
                                            {word}{' '}
                                        </span>
                                    );
                                })}
                            </h1>
                            <p className="text-[#6B7C75] dark:text-gray-400 text-lg leading-relaxed max-w-[500px]">{subheadline}</p>
                            <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Spin Button - Full width on mobile, Auto width on desktop */}
                                <button
                                    onClick={startSpin}
                                    disabled={isSpinning || (userStatus !== null && !userStatus?.canSpin)}
                                    className="w-full lg:w-fit min-w-[200px] max-w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-template4-primary text-white text-lg font-bold shadow-lg hover:bg-opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed lg:order-1"
                                >
                                    <span className="truncate">{isSpinning ? 'Spinning...' : buttonText || 'Start Your Journey'}</span>
                                </button>

                                {/* Stats Row - Side by side on mobile, row on desktop */}
                                <div className="flex flex-row items-center gap-3 lg:order-2">
                                    {/* Spins Remaining Badge */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex-1 lg:flex-none bg-white dark:bg-[#1A2421] px-4 py-2.5 rounded-xl shadow-xl border-2 border-template4-primary flex items-center gap-2 overflow-hidden whitespace-nowrap"
                                    >
                                        <span className="material-symbols-outlined flex-shrink-0 text-template4-primary fill-1" style={{ fontSize: '18px' }}>nature_people</span>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <span className="text-[8px] uppercase font-bold leading-tight whitespace-nowrap text-[#6B7C75] dark:text-gray-400">Spins</span>
                                            <span className="text-sm font-black leading-none mt-0.5 whitespace-nowrap text-template4-primary dark:text-[#E8F1EE]">
                                                {userStatus?.totalAvailable?.toString().padStart(2, '0') || '02'}
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* Joined Users Badge */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className="flex-1 lg:flex-none bg-white dark:bg-[#1A2421] px-4 py-2.5 rounded-xl shadow-xl border-2 border-template4-primary flex items-center gap-2 overflow-hidden whitespace-nowrap"
                                    >
                                        <span className="material-symbols-outlined flex-shrink-0 text-template4-primary fill-1" style={{ fontSize: '18px' }}>group</span>
                                        <div className="flex flex-col justify-center min-w-0">
                                            <span className="text-[8px] uppercase font-bold leading-tight whitespace-nowrap text-[#6B7C75] dark:text-gray-400">Joined</span>
                                            <span className="text-sm font-black leading-none mt-0.5 whitespace-nowrap text-template4-primary dark:text-[#E8F1EE]">
                                                {userStatus?.totalReferrals?.toString().padStart(2, '0') || '00'}
                                            </span>
                                        </div>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>

                        <EarnMoreSpinsCard
                            campaignId={campaign?.id}
                            userId={userId}
                            variant="dark"
                            referralThreshold={referralsRequired}
                            onTaskComplete={() => {
                                if (userId && campaign?.id) {
                                    axios.get(`/api/user/status?userId=${userId}&campaignId=${campaign.id}`)
                                        .then(res => setUserStatus(res.data))
                                        .catch(() => {});
                                }
                            }}
                        />
                    </div>
                </div>
            </section>

            {/* Social task modal removed - handled by shared EarnMoreSpinsCard */}

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
