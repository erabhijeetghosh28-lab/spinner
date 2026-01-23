'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TaskInstructionModal } from './social/TaskInstructionModal';

interface SocialTask {
    id: string;
    platform: string;
    actionType: string;
    title: string;
    targetUrl: string;
    spinsReward: number;
    isCompleted: boolean;
    completion?: {
        id: string;
        status: string;
        claimedAt: string;
        spinsAwarded?: number;
    };
}

interface SocialTasksPanelProps {
    campaignId: string;
    userId: string;
}

// Format action type for display (policy-compliant language)
function formatActionType(actionType: string): string {
    const actionMap: { [key: string]: string } = {
        // New policy-compliant types
        VISIT_PAGE: 'Visit Page',
        VISIT_PROFILE: 'Visit Profile',
        VIEW_POST: 'View Post',
        VIEW_DISCUSSION: 'View Discussion',
        VISIT_TO_SHARE: 'Visit to Share',
        // Legacy types (map to compliant language)
        LIKE_PAGE: 'Visit Page',
        LIKE_POST: 'View Post',
        FOLLOW: 'Visit Profile',
        SHARE: 'Visit to Share',
        COMMENT: 'View Discussion',
    };
    return actionMap[actionType.toUpperCase()] || actionType.replace('_', ' ');
}

export default function SocialTasksPanel({ campaignId, userId }: SocialTasksPanelProps) {
    const [tasks, setTasks] = useState<SocialTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<SocialTask | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchTasks();
    }, [campaignId, userId]);

    const fetchTasks = async () => {
        try {
            const res = await axios.get(
                `/api/social-tasks/complete?userId=${userId}&campaignId=${campaignId}`
            );
            setTasks(res.data.tasks || []);
        } catch (error) {
            console.error('Error fetching social tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskClick = (task: SocialTask) => {
        // Check if task is already completed or pending
        if (task.isCompleted || task.completion?.status === 'PENDING') {
            return; // Don't allow re-completion
        }
        setSelectedTask(task);
    };

    const handleTaskComplete = async () => {
        if (!selectedTask) return;

        try {
            await fetchTasks(); // Refresh to show pending state
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
            }, 3000);
        } catch (error) {
            console.error('Error refreshing tasks:', error);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-slate-400 text-center">Loading social tasks...</div>
            </div>
        );
    }

    if (tasks.length === 0) {
        return null; // Don't show if no tasks
    }

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold mb-4 text-amber-500">Earn Extra Spins</h3>
            <p className="text-slate-400 text-sm mb-6">
                Complete social media tasks to earn bonus spins instantly!
            </p>

            <div className="space-y-4">
                {tasks.map((task) => {
                    const isCompleted = task.isCompleted;

                    return (
                        <div
                            key={task.id}
                            className={`border rounded-lg p-4 ${
                                isCompleted
                                    ? 'border-green-500/30 bg-green-500/10'
                                    : 'border-slate-700 bg-slate-800/50'
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                                task.platform === 'FACEBOOK'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                                            }`}
                                        >
                                            {task.platform}
                                        </span>
                                        <span className="text-xs text-slate-400 uppercase">
                                            {formatActionType(task.actionType)}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-white mb-1">{task.title}</h4>
                                    <p className="text-sm text-slate-400">
                                        Reward: <span className="text-amber-500 font-bold">{task.spinsReward} spin(s)</span>
                                    </p>
                                </div>
                            </div>

                            {(() => {
                                const completionStatus = task.completion?.status;
                                
                                // PENDING: Verification in progress
                                if (completionStatus === 'PENDING') {
                                    return (
                                        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="animate-pulse">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                        <span className="text-xl">⏳</span>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-white">{task.title}</h4>
                                                    <p className="text-sm text-blue-400">⏱ Verification in progress</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        You'll receive WhatsApp notification once verified
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                // VERIFIED: Task verified, spins awarded
                                if (completionStatus === 'VERIFIED') {
                                    return (
                                        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">✅</span>
                                                    <div>
                                                        <h4 className="font-bold text-white">{task.title}</h4>
                                                        <p className="text-sm text-green-400">Verified</p>
                                                    </div>
                                                </div>
                                                <span className="text-sm text-slate-400">
                                                    +{task.completion?.spinsAwarded || task.spinsReward} spins awarded
                                                </span>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                // FAILED: Verification failed (silent, no notification)
                                if (completionStatus === 'FAILED') {
                                    return (
                                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">❌</span>
                                                <div>
                                                    <h4 className="font-bold text-white">{task.title}</h4>
                                                    <p className="text-sm text-red-400">Verification failed</p>
                                                    <p className="text-xs text-slate-400 mt-1">
                                                        Please try again or contact support
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                
                                // Available to complete
                                return (
                                    <div className="mt-4">
                                        <button
                                            onClick={() => handleTaskClick(task)}
                                            className="w-full px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-900 rounded-lg font-black text-sm transition-all uppercase tracking-wider shadow-lg hover:shadow-amber-500/20"
                                        >
                                            Complete Task → +{task.spinsReward} spin{task.spinsReward > 1 ? 's' : ''}
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>

            {/* Task Instruction Modal */}
            {selectedTask && (
                <TaskInstructionModal
                    task={selectedTask}
                    userId={userId}
                    campaignId={campaignId}
                    onClose={() => setSelectedTask(null)}
                    onComplete={handleTaskComplete}
                />
            )}

            {/* Success Message */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-2xl max-w-md w-full border border-white/10">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
                                <span className="text-4xl">✅</span>
                            </div>
                            <h2 className="text-2xl font-black text-white">Task Submitted!</h2>
                            <p className="text-slate-300">
                                We're verifying your completion in the background.
                            </p>
                            <p className="text-sm text-slate-400">
                                You'll receive a WhatsApp notification once verified with your bonus spins credited.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="w-full mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
                            >
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
