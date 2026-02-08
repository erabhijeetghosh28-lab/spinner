'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface SocialTask {
    id: string;
    type: 'FOLLOW' | 'SHARE' | 'LIKE';
    platform: string;
    description: string;
    reward: number;
    isCompleted: boolean;
}

interface EarnMoreSpinsCardProps {
    campaignId: string;
    userId?: string | null;
    variant?: 'light' | 'dark' | 'cyan';
    onTaskComplete?: () => void;
    referralThreshold?: number;
}

export default function EarnMoreSpinsCard({ 
    campaignId, 
    userId,
    variant = 'light',
    onTaskComplete,
    referralThreshold = 5
}: EarnMoreSpinsCardProps) {
    const [referralProgress, setReferralProgress] = useState({ current: 0, total: referralThreshold });
    const [isSharing, setIsSharing] = useState(false);
    const [tasks, setTasks] = useState<SocialTask[] | null>(null);

    // Fetch referral progress when component mounts
    useEffect(() => {
        if (userId && campaignId) {
            fetchReferralProgress();
        }
    }, [userId, campaignId]);

    // Fetch configured social tasks for this campaign (public endpoint)
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const res = await axios.get(`/api/social-tasks?campaignId=${campaignId}${userId ? `&userId=${userId}` : ''}`);
                setTasks(res.data.tasks || []);
            } catch (err) {
                console.error('Error fetching social tasks for EarnMoreSpinsCard:', err);
                setTasks([]);
            }
        };
        if (campaignId) fetchTasks();
    }, [campaignId, userId]);

    const fetchReferralProgress = async () => {
        try {
            const response = await axios.get(`/api/users/${userId}/referrals?campaignId=${campaignId}`);
            setReferralProgress({
                current: response.data.count || 0,
                total: referralThreshold
            });
        } catch (error) {
            console.error('Error fetching referral progress:', error);
        }
    };

    const handleShareWhatsApp = async () => {
        if (!userId) {
            toast.error('Please login to share');
            return;
        }

        setIsSharing(true);
        try {
            // Get user referral code
            const response = await axios.get(`/api/users/${userId}/referral-code`);
            const referralCode = response.data.referralCode;
            
            // Build WhatsApp share URL
            const shareUrl = `${window.location.origin}/landing/${campaignId}?ref=${referralCode}`;
            const message = encodeURIComponent(`🎁 Join this amazing giveaway! Spin to win exclusive prizes! ${shareUrl}`);
            const whatsappUrl = `https://wa.me/?text=${message}`;
            
            // Open WhatsApp
            window.open(whatsappUrl, '_blank');
            
            toast.success('Share link opened! Complete the share to earn +1 spin');
        } catch (error) {
            console.error('Error sharing:', error);
            toast.error('Failed to generate share link');
        } finally {
            setIsSharing(false);
        }
    };

    const handleSocialTask = async (taskType: string) => {
        if (!userId) {
            toast.error('Please login to complete tasks');
            return;
        }

        try {
            await axios.post('/api/social-tasks/complete', {
                userId,
                campaignId,
                taskType
            });
            
            toast.success('+1 Spin earned!');
            onTaskComplete?.();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to complete task');
        }
    };

    // Theme-specific styles
    const themes = {
        light: {
            cardBg: 'bg-white dark:bg-[#2c221a] border-gray-100 dark:border-gray-800',
            taskBg: 'bg-[#f8f7f5] dark:bg-[#221910] border-gray-100 dark:border-gray-700',
            text: 'text-[#181411] dark:text-white',
            textSecondary: 'text-[#8a7560] dark:text-gray-400',
            primaryBtn: 'bg-[#f48c25] hover:bg-[#f48c25]/90',
            whatsappBtn: 'bg-[#25D366] hover:bg-[#25D366]/90'
        },
        dark: {
            cardBg: 'bg-[#1a120b]/60 backdrop-blur-md border-white/10',
            taskBg: 'bg-[#0a0f1d]/40 border-white/5',
            text: 'text-white',
            textSecondary: 'text-gray-400',
            primaryBtn: 'bg-[#f48c25]/10 border border-[#f48c25]/30 text-[#f48c25] hover:bg-[#f48c25] hover:text-[#0a0f1d]',
            whatsappBtn: 'bg-[#25D366] hover:brightness-110'
        },
        cyan: {
            cardBg: 'glass-panel border-[#00f2ff]/10',
            taskBg: 'bg-[#0a0f1d]/40 border-white/5',
            text: 'text-white',
            textSecondary: 'text-gray-400',
            primaryBtn: 'bg-[#00f2ff]/10 border border-[#00f2ff]/30 text-[#00f2ff] hover:bg-[#00f2ff] hover:text-[#0a0f1d]',
            whatsappBtn: 'bg-[#25D366] hover:brightness-110'
        }
    };

    const theme = themes[variant];

    return (
        <div className={`flex flex-col gap-4 rounded-2xl ${theme.cardBg} p-6 shadow-[0_8px_30px_rgb(0,0,0,0.08)]`}>
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div className="flex flex-col">
                    <h3 className={`text-xl font-black flex items-center gap-2 ${theme.text}`}>
                        <span className="material-symbols-outlined text-primary">redeem</span>
                        Earn More Spins
                    </h3>
                    <p className={`text-sm ${theme.textSecondary}`}>
                        Boost your chances by completing simple tasks below.
                    </p>
                </div>
            </div>

            {/* Social Tasks Grid (render only if configured tasks exist) */}
            {tasks && tasks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {tasks.map((t) => (
                        <div key={t.id} className={`flex items-center justify-between p-4 rounded-xl ${theme.taskBg} border`}>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-primary uppercase tracking-tighter">
                                    {t.platform}
                                </span>
                                <span className={`font-bold text-sm ${theme.text}`}>{t.description}</span>
                            </div>
                            <button
                                onClick={() => handleSocialTask(t.type)}
                                className={`h-9 px-4 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${theme.primaryBtn}`}
                            >
                                +{t.reward || 1} Spin
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            {/* WhatsApp Referral Task (kept separate) */}
            <div className={`flex flex-col gap-3 p-4 rounded-xl ${theme.taskBg} border mt-2`}>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-[#25D366] uppercase tracking-tighter">
                            Referral Power
                        </span>
                        <span className={`font-bold text-sm ${theme.text}`}>Invite {referralThreshold} friends</span>
                    </div>
                    <div className="bg-[#25D366]/10 text-[#25D366] px-2 py-1 rounded text-[10px] font-black uppercase">
                        +1 Spin
                    </div>
                </div>
                
                <button
                    onClick={handleShareWhatsApp}
                    disabled={isSharing}
                    className={`w-full h-10 rounded-lg text-white text-sm font-bold flex items-center justify-center gap-2 transition-all ${theme.whatsappBtn}`}
                >
                    <span className="material-symbols-outlined !text-[18px]">share</span>
                    {isSharing ? 'Opening...' : 'Share on WhatsApp'}
                </button>
                
                {/* Progress bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
                    <div 
                        className="bg-[#25D366] h-full transition-all" 
                        style={{ width: `${(referralProgress.current / referralProgress.total) * 100}%` }}
                    ></div>
                </div>
                <p className={`text-[10px] text-center ${theme.textSecondary}`}>
                    {referralProgress.current}/{referralProgress.total} friends invited
                </p>
            </div>
        </div>
    );
}
