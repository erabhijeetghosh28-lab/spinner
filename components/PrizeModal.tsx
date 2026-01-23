'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface PrizeModalProps {
    prize: { name: string; description?: string; couponCode?: string; imageUrl?: string | null } | null;
    isOpen: boolean;
    onClose: () => void;
    onWhatsAppShare?: () => void;
    campaignName?: string;
    referralCode?: string;
    shareUrl?: string;
}

const PrizeModal: React.FC<PrizeModalProps> = ({ prize, isOpen, onClose, onWhatsAppShare, campaignName, referralCode, shareUrl }) => {
    React.useEffect(() => {
        if (isOpen && prize && !isNoPrize) {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#f59e0b', '#1e3a8a', '#ffffff']
            });
        }
    }, [isOpen, prize]);

    if (!isOpen || !prize) return null;

    const isNoPrize = prize.name === 'No Prize' || (prize as any).tryAgain || prize.name.toLowerCase().includes('no offer');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    className="bg-slate-800 border-2 border-amber-500 rounded-3xl p-8 max-w-sm w-full text-center shadow-[0_0_100px_rgba(245,158,11,0.4)]"
                >
                    <div className="text-6xl mb-4">
                        {isNoPrize ? '😔' : '🎉'}
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {isNoPrize ? 'Oops!' : 'Congratulations!'}
                    </h2>

                    <p className="text-slate-400 mb-6">
                        {isNoPrize ? 'Better luck next time!' : "You've won:"}
                    </p>

                    {!isNoPrize && (
                        <>
                            {prize.imageUrl && (
                                <div className="mb-4 flex justify-center">
                                    <img
                                        src={prize.imageUrl}
                                        alt={prize.name}
                                        className="w-32 h-32 md:w-40 md:h-40 rounded-2xl object-cover border-4 border-amber-500 shadow-lg"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            )}
                            <div className="bg-amber-500 text-slate-900 font-black text-2xl py-4 px-6 rounded-xl mb-4 transform rotate-2">
                                {prize.name}
                            </div>
                            {prize.couponCode && (
                                <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg mb-6">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1">Your Coupon Code</p>
                                    <p className="text-xl font-mono text-amber-500 font-bold">{prize.couponCode}</p>
                                </div>
                            )}
                        </>
                    )}

                    <p className="text-sm text-slate-300 mb-8 font-medium">
                        {prize.description || (isNoPrize ? "Don't give up, try again tomorrow!" : "We've sent this to your WhatsApp!")}
                    </p>

                    {!isNoPrize && (onWhatsAppShare || (referralCode && shareUrl)) && (
                        <button
                            onClick={() => {
                                if (onWhatsAppShare) {
                                    onWhatsAppShare();
                                } else if (referralCode && shareUrl) {
                                    const message = encodeURIComponent(
                                        `🎉 I just won ${prize.name} on ${campaignName || 'the wheel'}!\n\n` +
                                        `Try your luck! Use my referral code: ${referralCode}\n` +
                                        `${shareUrl}`
                                    );
                                    window.open(`https://wa.me/?text=${message}`, '_blank');
                                }
                            }}
                            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold mt-4 transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span>📱 Share on WhatsApp</span>
                        </button>
                    )}

                    <button
                        onClick={onClose}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors mt-2"
                    >
                        Close
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PrizeModal;
