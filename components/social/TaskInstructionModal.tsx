'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface SocialMediaTask {
    id: string;
    platform: string;
    actionType: string;
    title: string;
    targetUrl: string;
    spinsReward: number;
}

interface TaskInstructionModalProps {
    task: SocialMediaTask;
    userId: string;
    campaignId: string;
    onClose: () => void;
    onComplete: () => void;
}

export function TaskInstructionModal({
    task,
    userId,
    campaignId,
    onClose,
    onComplete,
}: TaskInstructionModalProps) {
    const [timer, setTimer] = useState(15); // Increased to 15 seconds
    const [linkOpened, setLinkOpened] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [clicking, setClicking] = useState(false);
    const [completionId, setCompletionId] = useState<string | null>(null);
    const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Cleanup interval on unmount
        return () => {
            if (countdownInterval) {
                clearInterval(countdownInterval);
            }
        };
    }, [countdownInterval]);

    const handleOpenLink = async () => {
        if (clicking) return;

        setClicking(true);
        try {
            // First, call /click endpoint to track server-side timestamp
            const clickRes = await axios.post('/api/social-tasks/click', {
                taskId: task.id,
                userId,
                campaignId,
            });

            if (clickRes.data.success) {
                setCompletionId(clickRes.data.completionId);
                
                // Now open the link in new tab
                window.open(task.targetUrl, '_blank');
                setLinkOpened(true);

                // Start 15-second countdown
                const interval = setInterval(() => {
                    setTimer((prev) => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);

                setCountdownInterval(interval);
            } else {
                alert(clickRes.data.error || 'Failed to start task. Please try again.');
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.error || 'Failed to start task. Please try again.';
            alert(errorMessage);
        } finally {
            setClicking(false);
        }
    };

    const handleConfirm = async () => {
        if (completing || !completionId) return;

        setCompleting(true);
        try {
            // Call /complete with completionId (not taskId)
            const res = await axios.post('/api/social-tasks/complete', {
                completionId: completionId,
            });

            if (res.data.success) {
                // Show success message
                alert(res.data.message || `Task verified! You've earned ${res.data.spinsAwarded || task.spinsReward} bonus spin(s).`);
                onComplete();
                onClose();
            } else {
                alert(res.data.error || 'Failed to complete task');
            }
        } catch (error: any) {
            const errorMessage =
                error.response?.data?.error || 'Failed to complete task. Please try again.';
            alert(errorMessage);
        } finally {
            setCompleting(false);
        }
    };

    const getActionDescription = () => {
        const actionMap: { [key: string]: string } = {
            // New VISIT action types (policy-compliant)
            VISIT_PAGE: 'visit our page',
            VISIT_PROFILE: 'visit our profile',
            VIEW_POST: 'view the post',
            VIEW_DISCUSSION: 'view the discussion',
            VISIT_TO_SHARE: 'visit to share',
            // Legacy action types (backward compatibility)
            FOLLOW: 'visit our profile',
            LIKE_POST: 'view the post',
            LIKE_PAGE: 'visit our page',
            SHARE: 'visit to share',
            COMMENT: 'view the discussion',
        };
        return actionMap[task.actionType.toUpperCase()] || 'visit the page';
    };

    const getPlatformName = () => {
        const platformMap: { [key: string]: string } = {
            FACEBOOK: 'Facebook',
            INSTAGRAM: 'Instagram',
            TWITTER: 'Twitter',
            YOUTUBE: 'YouTube',
        };
        return platformMap[task.platform] || task.platform;
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl"
                >
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">
                            {task.platform === 'INSTAGRAM' ? '📷' : task.platform === 'FACEBOOK' ? '👍' : '🔗'}
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">{task.title}</h3>
                        <p className="text-slate-400 text-sm">
                            Earn <span className="text-amber-500 font-bold">+{task.spinsReward} spin{task.spinsReward > 1 ? 's' : ''}</span> upon completion
                        </p>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-4 mb-6">
                        <div className="flex items-start gap-3">
                            <span className="text-amber-500 font-black text-lg">1.</span>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Click the button below to open our {getPlatformName()} page in a new tab
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-amber-500 font-black text-lg">2.</span>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Complete the action: <span className="font-semibold text-white">{getActionDescription()}</span>
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <span className="text-amber-500 font-black text-lg">3.</span>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Return here and confirm completion (wait {timer}s)
                            </p>
                        </div>
                    </div>

                    {/* Action Button */}
                    {!linkOpened ? (
                        <button
                            onClick={handleOpenLink}
                            disabled={clicking}
                            className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-black text-white transition-all uppercase tracking-wider text-sm shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {clicking ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Starting...
                                </span>
                            ) : (
                                `Visit ${getPlatformName()}`
                            )}
                        </button>
                    ) : (
                        <>
                            {timer > 0 ? (
                                <div className="text-center space-y-4">
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                                        <div className="text-4xl mb-2">⏳</div>
                                        <p className="text-slate-300 text-sm font-semibold mb-1">
                                            Visit the page, then claim your reward in
                                        </p>
                                        <p className="text-3xl font-black text-amber-500">{timer}s</p>
                                    </div>
                                    <button
                                        disabled
                                        className="w-full px-6 py-4 bg-slate-700 text-slate-400 rounded-xl font-black cursor-not-allowed uppercase tracking-wider text-sm"
                                    >
                                        Please Wait...
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConfirm}
                                    disabled={completing || !completionId}
                                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl font-black text-white transition-all uppercase tracking-wider text-sm shadow-lg hover:shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {completing ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Verifying...
                                        </span>
                                    ) : (
                                        '✓ Claim Reward'
                                    )}
                                </button>
                            )}
                        </>
                    )}

                    {/* Cancel Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-4 text-slate-400 text-sm font-semibold hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
