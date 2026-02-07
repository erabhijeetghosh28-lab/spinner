'use client';

import PrizeModal from '@/components/PrizeModal';
import SpinWheel from '@/components/SpinWheel_V2';
import { soundEffects } from '@/lib/soundEffects';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import EarnMoreSpinsCard from '../../shared/EarnMoreSpinsCard';

interface HeroProps {
    section: any;
    campaign: any;
    userId?: string | null;
    landingPage: any;
}

export default function Hero({ section, campaign, userId, landingPage }: HeroProps) {
    const [spinsRemaining, setSpinsRemaining] = useState(0);
    const [joinedUsers, setJoinedUsers] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [wonPrize, setWonPrize] = useState<any>(null);
    const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | undefined>(undefined);
    const [prizes, setPrizes] = useState<any[]>([]);
    const [referralThreshold, setReferralThreshold] = useState(5); // Default to 5

    // Use prizes from campaign (public landing – no admin API)
    useEffect(() => {
        if (campaign?.prizes?.length) {
            setPrizes(campaign.prizes);
        }
    }, [campaign?.prizes]);

    // Fetch spins remaining and user stats
    useEffect(() => {
        if (userId && campaign?.id) {
            fetchUserSpins();
            fetchCampaignStats();
        }
    }, [userId, campaign?.id]);

    // Fetch campaign settings including referral threshold
    useEffect(() => {
        if (campaign?.referralThreshold) {
            setReferralThreshold(campaign.referralThreshold);
        }
    }, [campaign]);

    const fetchUserSpins = async () => {
        try {
            const response = await axios.get(`/api/user-spins/${userId}/${campaign.id}`);
            setSpinsRemaining(response.data.remainingSpins || 0);
        } catch (error) {
            console.error('Error fetching spins:', error);
        }
    };

    const fetchCampaignStats = async () => {
        try {
            const response = await axios.get(`/api/campaigns/${campaign.id}/stats`);
            setJoinedUsers(response.data.totalUsers || 0);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const pendingPrizeRef = useRef<any>(null);
    const [pendingPrize, setPendingPrize] = useState<any>(null);

    const handleSpin = async () => {
        if (!userId) {
            toast.error('Please login to spin');
            return;
        }

        if (spinsRemaining <= 0) {
            toast.error('No spins remaining. Complete tasks to earn more!');
            return;
        }

        // Reset and start visual spin immediately (match Template2 behavior)
        setWonPrize(null);
        setPendingPrize(null);
        pendingPrizeRef.current = null;
        setSelectedPrizeIndex(undefined);
        setIsSpinning(true);
        soundEffects.playSpinSound();

        try {
            const response = await axios.post('/api/spin', {
                userId,
                campaignId: campaign.id
            });

            const prize = response.data.prize;
            const tryAgain = response.data.tryAgain === true;
            setPendingPrize({ ...prize, tryAgain });
            pendingPrizeRef.current = { ...prize, tryAgain };
            const prizeIndex = prizes.findIndex(p => p.id === prize.id);
            setSelectedPrizeIndex(prizeIndex >= 0 ? prizeIndex : undefined);
            // landing and modal will be handled by handleSpinFinished when wheel finishes
            setSpinsRemaining(prev => prev - 1);

        } catch (error: any) {
            console.error('Spin error:', error);
            setIsSpinning(false);
            soundEffects.stopSpinSound();
            toast.error(error.response?.data?.error || 'Failed to spin');
        }
    };

    const handleSpinFinished = (prize: any) => {
        setIsSpinning(false);
        soundEffects.stopSpinSound();

        const finalPrize = prize || pendingPrizeRef.current || pendingPrize;
        console.log('Spin Finished. Prize:', finalPrize);

        if (finalPrize) {
            setWonPrize(finalPrize);
            if (!finalPrize.tryAgain) {
                soundEffects.playWinSound();
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }
            setShowPrizeModal(true);
        } else {
            toast.info('Better luck next time!');
        }
    };

    const handleTaskComplete = () => {
        // Refresh spins after task completion
        fetchUserSpins();
    };

    return (
        <section className="w-full max-w-[1200px] mx-auto px-6 py-12 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Left Column - Spin Wheel */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
                    <SpinWheel 
                        isSpinning={isSpinning}
                        onSpinClick={isSpinning ? undefined : handleSpin}
                        onFinished={handleSpinFinished}
                        prizes={prizes}
                        selectedPrizeIndex={selectedPrizeIndex}
                        logoUrl={campaign?.logoUrl}
                    />
                </div>

                {/* Right Column - Content */}
                <div className="lg:col-span-7 flex flex-col gap-8">
                    <div className="flex flex-col gap-4">
                        {/* Badge */}
                        <div className="inline-flex items-center rounded-full bg-[#f48c25]/10 px-3 py-1 text-[#f48c25] text-xs font-bold uppercase tracking-wider w-fit">
                            Limited Time Campaign
                        </div>

                        {/* Headline */}
                        <h1 className="text-[#181411] text-3xl md:text-6xl font-black leading-tight tracking-[-0.033em]">
                            {section?.content?.headline || (
                                <>
                                    Spin to Win: Your Exclusive <span className="text-[#f48c25]">Brand Giveaway!</span>
                                </>
                            )}
                        </h1>

                        {/* Description */}
                        <p className="text-[#8a7560] text-lg leading-relaxed max-w-[500px]">
                            {section?.content?.description || 
                                'Take a spin on our prize wheel for a chance to win exclusive discounts and premium products. Out of spins? Invite friends to keep playing!'
                            }
                        </p>

                        {/* CTA Section - Responsive: Stacked on Mobile, Row on Desktop */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mt-4">
                            {/* Spin Button - Full width on mobile, Auto width on desktop */}
                            <button 
                                onClick={handleSpin}
                                disabled={isSpinning || spinsRemaining <= 0}
                                className="w-full lg:w-fit min-w-[200px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-14 px-8 bg-[#f48c25] text-white text-lg font-bold shadow-lg hover:shadow-[#f48c25]/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed lg:order-1"
                            >
                                <span className="truncate">{isSpinning ? 'Spinning...' : 'Spin the Wheel Now'}</span>
                            </button>

                            {/* Stats Row - Side by side on mobile, continuing row on desktop */}
                            <div className="flex flex-row items-center gap-3 lg:order-2">
                                {/* Spins Remaining Badge */}
                                <div className="flex-1 lg:flex-none flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-md border-2 border-[#f48c25] whitespace-nowrap">
                                    <span className="material-symbols-outlined text-[#f48c25] fill-1 text-sm">toll</span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] uppercase font-bold text-[#8a7560] leading-none">Spins</span>
                                        <span className="text-sm font-black text-[#181411] leading-none">{spinsRemaining}</span>
                                    </div>
                                </div>

                                {/* Joined Users Badge */}
                                <div className="flex-1 lg:flex-none flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-md border-2 border-gray-100 whitespace-nowrap">
                                    <span className="material-symbols-outlined text-[#f48c25] text-sm">group</span>
                                    <div className="flex flex-col">
                                        <span className="text-[8px] uppercase font-bold text-[#8a7560] leading-none">Joined</span>
                                        <span className="text-sm font-black text-[#181411] leading-none">{joinedUsers.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Earn More Spins Card */}
                    <EarnMoreSpinsCard 
                        campaignId={campaign?.id}
                        userId={userId}
                        variant="light"
                        onTaskComplete={handleTaskComplete}
                        referralThreshold={referralThreshold}
                    />
                </div>
            </div>

            {/* Prize Modal */}
            {showPrizeModal && wonPrize && (
                <PrizeModal
                    isOpen={showPrizeModal}
                    onClose={() => setShowPrizeModal(false)}
                    prize={wonPrize}
                />
            )}
        </section>
    );
}
