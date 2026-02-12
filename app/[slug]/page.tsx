'use client';

import OTPForm from '@/components/OTPForm';
import PrizeModal from '@/components/PrizeModal';
import SocialStatsBar from '@/components/SocialStatsBar';
import SocialTasksPanel from '@/components/SocialTasksPanel';
import SpinWheel from '@/components/SpinWheel_V2';
import LandingPageRenderer from '@/components/landing/LandingPageRenderer';
import { soundEffects } from '@/lib/soundEffects';
import axios from 'axios';
import confetti from 'canvas-confetti';
import { AnimatePresence, motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

export default function TenantCampaignPage() {
    const params = useParams();
    const tenantSlug = params.slug as string;

    const [campaign, setCampaign] = useState<any>(null);
    const [showLandingPage, setShowLandingPage] = useState(false);
    const [prizes, setPrizes] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isVerified, setIsVerified] = useState<boolean>(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isSpinning, setIsSpinning] = useState(false);
    const [showPrizeModal, setShowPrizeModal] = useState(false);
    const [wonPrize, setWonPrize] = useState<any>(null);
    const [pendingPrize, setPendingPrize] = useState<any>(null);
    const [selectedPrizeIndex, setSelectedPrizeIndex] = useState<number | undefined>(undefined);
    const [tryAgainMessage, setTryAgainMessage] = useState<string | null>(null);
    const [showUserForm, setShowUserForm] = useState(false);
    const [userDetails, setUserDetails] = useState({ name: '', email: '' });
    const [referralCode, setReferralCode] = useState<string | null>(null);
    const [leaders, setLeaders] = useState<any[]>([]);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [userStatus, setUserStatus] = useState<any>(null);
    const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(true);

    useEffect(() => {
        if (tenantSlug) {
            fetchCampaign();
        }

        // Get referral code from URL
        const searchParams = new URLSearchParams(window.location.search);
        const ref = searchParams.get('ref');
        if (ref) setReferralCode(ref);

        // Restore user session from localStorage if available
        const savedUser = localStorage.getItem('offer-wheel-user');
        const savedExpiry = localStorage.getItem('offer-wheel-user-expiry');
        
        if (savedUser && savedExpiry) {
            const expiryTime = parseInt(savedExpiry);
            const now = Date.now();
            
            // Check if session is still valid (not expired)
            if (now < expiryTime) {
                try {
                    const userData = JSON.parse(savedUser);
                    setUser(userData);
                    setIsVerified(true);
                    setShowLoginModal(false);
                    console.log('[Session Restore] User session restored from localStorage');
                } catch (error) {
                    console.error('[Session Restore] Failed to parse saved user:', error);
                    // Clear invalid data
                    localStorage.removeItem('offer-wheel-user');
                    localStorage.removeItem('offer-wheel-user-expiry');
                }
            } else {
                // Session expired, clear it
                console.log('[Session Restore] Session expired, clearing localStorage');
                localStorage.removeItem('offer-wheel-user');
                localStorage.removeItem('offer-wheel-user-expiry');
            }
        }
    }, [tenantSlug]);

    // Auto-logout after 24 hours of inactivity (no user action)
    useEffect(() => {
        if (!user || !isVerified) return;

        // Initialize expiry time if not set
        const savedExpiry = localStorage.getItem('offer-wheel-user-expiry');
        if (!savedExpiry) {
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('offer-wheel-user-expiry', expiryTime.toString());
        }

        const resetIdleTimer = () => {
            // Reset expiry time to 24 hours from now
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('offer-wheel-user-expiry', expiryTime.toString());
        };

        const checkSessionExpiry = () => {
            const savedExpiry = localStorage.getItem('offer-wheel-user-expiry');
            if (!savedExpiry) {
                // Session expired - log out user
                console.log('[Idle Timeout] Session expired - logging out');
                setUser(null);
                setWonPrize(null);
                setIsVerified(false);
                setUserStatus(null);
                setShowLoginModal(true);
                localStorage.removeItem('offer-wheel-user');
                localStorage.removeItem('offer-wheel-user-expiry');
                return;
            }

            const expiryTime = parseInt(savedExpiry);
            const now = Date.now();
            const timeRemaining = expiryTime - now;

            if (now >= expiryTime) {
                // Session expired due to inactivity - log out user
                console.log('[Idle Timeout] Session expired due to inactivity - logging out');
                setUser(null);
                setWonPrize(null);
                setIsVerified(false);
                setUserStatus(null);
                setShowLoginModal(true);
                localStorage.removeItem('offer-wheel-user');
                localStorage.removeItem('offer-wheel-user-expiry');
            } else {
                console.log(`[Idle Timeout] Time remaining: ${Math.round(timeRemaining / 1000)}s`);
            }
        };

        // Track only intentional user actions (removed mousemove as it's too sensitive)
        const activityEvents = ['mousedown', 'keydown', 'keypress', 'scroll', 'touchstart', 'click', 'wheel'];
        
        // Throttle activity handler to prevent too frequent resets
        let activityTimeout: NodeJS.Timeout | null = null;
        const handleActivity = () => {
            // Only reset timer if it's been at least 5 seconds since last reset
            if (activityTimeout) return;
            
            activityTimeout = setTimeout(() => {
                activityTimeout = null;
            }, 5000); // Throttle to max once per 5 seconds
            
            resetIdleTimer();
            console.log('[Idle Timeout] Activity detected - timer reset');
        };

        // Add event listeners for user activity
        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Check immediately
        checkSessionExpiry();

        // Check every 60 seconds for expiry
        const interval = setInterval(checkSessionExpiry, 60 * 1000);

        return () => {
            // Cleanup event listeners
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (activityTimeout) clearTimeout(activityTimeout);
            clearInterval(interval);
        };
    }, [user, isVerified]);

    const fetchLeaderboard = async () => {
        try {
            const res = await axios.get(`/api/leaderboard`);
            console.log('[Leaderboard] Received:', res.data.leaders?.length || 0, 'leaders');
            setLeaders(res.data.leaders || []);
        } catch (err: any) {
            // Silently handle leaderboard errors - it's not critical functionality
            if (err.response?.status !== 404) {
                console.error('[Leaderboard] Error:', err.message || 'Failed to fetch leaderboard');
            }
            // Set empty array on error to prevent UI issues
            setLeaders([]);
        }
    };

    // Real-time leaderboard updates via Server-Sent Events
    useEffect(() => {
        if (!campaign) return;

        let eventSource: EventSource | null = null;
        let pollFallback: NodeJS.Timeout | null = null;

        const setupSSE = () => {
            try {
                eventSource = new EventSource('/api/leaderboard/live');

                eventSource.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'update' && data.leaders) {
                            console.log('[SSE Leaderboard] Real-time update:', data.leaders.length, 'leaders');
                            setLeaders(data.leaders);
                        } else if (data.type === 'connected') {
                            console.log('[SSE Leaderboard] Connected to real-time updates');
                        }
                    } catch (err) {
                        console.error('[SSE Leaderboard] Parse error:', err);
                    }
                };

                eventSource.onerror = (error) => {
                    console.warn('[SSE Leaderboard] Connection error, falling back to polling:', error);
                    eventSource?.close();
                    eventSource = null;
                    
                    // Fallback to polling every 10 seconds if SSE fails
                    pollFallback = setInterval(() => {
                        fetchLeaderboard();
                    }, 10000);
                };
            } catch (err) {
                console.error('[SSE Leaderboard] Setup error:', err);
                // Fallback to polling
                pollFallback = setInterval(() => {
                    fetchLeaderboard();
                }, 10000);
            }
        };

        setupSSE();

        // Cleanup on unmount
        return () => {
            if (eventSource) {
                eventSource.close();
            }
            if (pollFallback) {
                clearInterval(pollFallback);
            }
        };
    }, [campaign?.id]);

    // Fetch leaderboard and user status when campaign and user are ready
    useEffect(() => {
        fetchLeaderboard();

        // Handle user status if logged in
        if (user) {
            // Validate tenant match (only if campaign is loaded)
            if (campaign && user.tenantId && user.tenantId !== campaign.tenantId) {
                console.log("[Session] Tenant mismatch, logging out");
                handleLogout();
            } else if (campaign) {
                // Fetch user status only if campaign is loaded
                fetchUserStatus();
            }
        }
    }, [campaign?.id, user?.id]); // Trigger when campaign or user changes

    // Fallback: if status doesn't arrive in time, show an error instead of infinite loading
    useEffect(() => {
        if (!user) return;
        const timer = setTimeout(() => {
            if (!userStatus && !isRefreshingStatus) {
                setStatusError('Unable to load spin status. Please retry.');
            }
        }, 4000);
        return () => clearTimeout(timer);
    }, [user, userStatus, isRefreshingStatus]);


    const fetchUserStatus = async () => {
        if (!user || !campaign) {
            console.log('[fetchUserStatus] Skipped: missing user or campaign', { user: !!user, campaign: !!campaign });
            return;
        }
        console.log('[fetchUserStatus] Starting API call', { userId: user.id, campaignId: campaign.id });
        try {
            setIsRefreshingStatus(true);
            setStatusError(null);
            const res = await axios.get(`/api/user/status?userId=${user.id}&campaignId=${campaign.id}`);
            console.log('[fetchUserStatus] Success:', res.data);
            setUserStatus(res.data);
        } catch (err: any) {
            console.error('[fetchUserStatus] Error:', err);
            console.error('[fetchUserStatus] Error response:', err.response?.data);
            setStatusError(err.response?.data?.error || 'Failed to load spin status');
        } finally {
            setIsRefreshingStatus(false);
            console.log('[fetchUserStatus] Complete');
        }
    };

    const fetchCampaign = async () => {
        try {
            setInitialLoading(true);
            
            if (!tenantSlug || typeof tenantSlug !== 'string') {
                setCampaign(null);
                setInitialLoading(false);
                return;
            }

            const response = await axios.get(`/api/campaigns?tenantSlug=${tenantSlug}`);

            if (!response.data.campaign) {
                setCampaign(null);
                setPrizes([]);
                return;
            }

            const campaignData = response.data.campaign;
            setCampaign(campaignData);
            setPrizes(response.data.prizes || []);

            // Check if there's a published landing page (unless bypassed with ?spin=true)
            const searchParams = new URLSearchParams(window.location.search);
            const bypassLandingPage = searchParams.get('spin') === 'true';
            
            if (!bypassLandingPage) {
                try {
                    const landingPageRes = await axios.get(`/api/landing-page/${campaignData.id}`);
                    if (landingPageRes.data.landingPage?.isPublished) {
                        setShowLandingPage(true);
                        return; // Show landing page instead of spin wheel
                    }
                } catch (err) {
                    // No landing page or not published - continue with normal flow
                    console.log('No published landing page found, showing spin wheel');
                }
            }
        } catch (error: any) {
            // Suppress console.error for 404s to prevent white-on-black dev overlay
            if (error.response?.status !== 404) {
                console.error('Error fetching campaign:', error);
            } else {
                console.log(`Campaign not found for slug: ${tenantSlug}`);
            }
            setCampaign(null);
            setPrizes([]);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSendOTP = async (phone: string) => {
        try {
            if (!tenantSlug) throw new Error("No tenant slug");
            await axios.post('/api/otp/send', { phone, tenantSlug });
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleVerifyOTP = async (phone: string, otp: string, name?: string) => {
        const response = await axios.post('/api/otp/verify', {
            phone,
            otp,
            name,
            referralCode,
            tenantSlug
        });
        const userData = response.data.user;
            setUser(userData);
            setIsVerified(true);
            
            // Hide login modal immediately after successful login
            setShowLoginModal(false);
            
            // Save user with 24-hour idle expiry (will be reset on user activity)
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('offer-wheel-user', JSON.stringify(userData));
            localStorage.setItem('offer-wheel-user-expiry', expiryTime.toString());

        // Clear any guest prize state - user must spin after verification
        setWonPrize(null);
        setPendingPrize(null);

        // Immediately fetch user status so the wheel view appears
        if (campaign) {
            try {
                const res = await axios.get(`/api/user/status?userId=${userData.id}&campaignId=${campaign.id}`);
                setUserStatus(res.data);
            } catch (err) {
                console.error('[verify->status] Error:', err);
            }
        }
    };

    const startSpin = async () => {
        if (isSpinning) return;

        // REQUIRE USER VERIFICATION - NO GUEST SPINS
        if (!user || !user.id) {
            alert('Please verify your phone number first to spin the wheel!');
            return;
        }

        // Enforce status gate: if no spins available, block and show guidance
        if (userStatus && !userStatus.canSpin) {
            const waitMsg = (userStatus.nextSpinInHours || 0) > 0 ? ` Wait ${userStatus.nextSpinInHours}h or invite friends to unlock a bonus spin.` : ' Invite friends to unlock a bonus spin.';
            alert(`You've used all available spins.${waitMsg}`);
            return;
        }

        // Clear previous results
        setWonPrize(null);
        setTryAgainMessage(null);

        // AUTHENTICATED SPIN ONLY
        try {
            const isUsingBonus = userStatus && userStatus.baseSpinsAvailable === 0 && userStatus.bonusSpinsAvailable > 0;

            // Call API first to get the target prize
            const response = await axios.post('/api/spin', {
                userId: user.id,
                campaignId: campaign.id,
                isReferralBonus: isUsingBonus
            });

            const prize = response.data.prize;
            const prizeIndex = prizes.findIndex(p => p.id === prize.id);
            const isTryAgain = response.data.tryAgain === true;

            // Set state for the wheel and modal
            setPendingPrize({
                ...prize,
                tryAgain: isTryAgain,
                message: response.data.message
            });
            setSelectedPrizeIndex(prizeIndex >= 0 ? prizeIndex : undefined);
            setTryAgainMessage(isTryAgain ? (response.data.message || 'Sorry, try again in some time') : null);

            // Now start the visual spin
            setIsSpinning(true);
            soundEffects.playSpinSound();
        } catch (error: any) {
            const status = error.response?.status;
            if (status === 404 || status === 403) {
                handleLogout();
                const msg = status === 404
                    ? 'Session expired. Please try again.'
                    : 'Session invalid for this campaign. Please verify again.';
                alert(msg);
            } else if (status === 429) {
                alert(error.response?.data?.error || 'Spin limit reached. Invite friends to unlock more spins.');
            } else {
                console.error('Spin error:', error);
                alert(error.response?.data?.error || 'Something went wrong');
            }
        } finally {
            fetchUserStatus();
            // Refresh leaderboard after spin attempt
            if (campaign?.tenantId) {
                setTimeout(() => fetchLeaderboard(), 500); // Small delay to ensure DB is updated
            }
        }
    };

    const handleLogout = () => {
        setUser(null);
        setWonPrize(null);
        setIsVerified(false);
        setUserStatus(null);
        setShowLoginModal(true); // Show login modal again
        localStorage.removeItem('offer-wheel-user');
        localStorage.removeItem('offer-wheel-user-expiry');
    };

    const handleSpinFinished = async (resultPrize?: any) => {
        setIsSpinning(false);
        soundEffects.stopSpinSound();

        // Use the prize passed by the wheel if available, fallback to state
        const finalPrize = resultPrize || pendingPrize;

        if (finalPrize && user) {
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

                // Trigger confetti
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f59e0b', '#1e3a8a', '#ffffff']
                });

                // Auto-send WhatsApp message with coupon and invitation is handled by backend
                if (finalPrize.couponCode && user) {
                    try {
                        // Track share action (optional here, but keeping for logic consistency)
                        try {
                            await axios.post('/api/user/share-action', { userId: user.id });
                        } catch (e) {
                            console.error('Error tracking share:', e);
                        }
                    } catch (error) {
                        console.error('Error handling win state:', error);
                    }
                }
            }

            // Refresh leaderboard after any spin result (win or loss)
            if (campaign?.tenantId) {
                setTimeout(() => fetchLeaderboard(), 500);
            }

            setShowPrizeModal(true);
        }
    };

    const handleUserFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post('/api/user', { userId: user.id, ...userDetails });
            setShowUserForm(false);
            alert('Details saved! Check WhatsApp for your coupon.');
        } catch (error) {
            alert('Failed to save details');
        }
    };

    const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}?ref=${user?.referralCode}` : '';
    const shareText = `🎡 Try your luck and win prizes! 🎁`;

    const shareOnWhatsApp = async () => {
        if (!user?.referralCode || !wonPrize) return;
        const message = encodeURIComponent(`🎉 I won ${wonPrize.name}!\n\nTry your luck: ${shareUrl}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
        // Tracking is now primarily handled by successful registration
    };

    const handleShare = async (platform?: string) => {
        if (!user?.referralCode) return;
        const text = shareText, url = shareUrl;

        if (platform === 'whatsapp') {
            window.open(`https://wa.me/?text=${encodeURIComponent(text + '\n\n' + url)}`, '_blank');
        } else if (platform === 'copy') {
            navigator.clipboard.writeText(url);
            alert('Referral link copied to clipboard!');
        } else if (navigator.share) {
            try {
                await navigator.share({ title: 'Spin & Win', text, url });
            } catch (err) { }
        } else {
            navigator.clipboard.writeText(url);
            alert('Referral link copied!');
        }

        // Referral bonuses are now awarded only on registration
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading prizes...</p>
                </div>
            </div>
        );
    }

    if (!campaign) {
        return (
            <div className="min-h-screen bg-[#020617] text-white relative flex items-center justify-center p-6">
                {/* Premium Mesh Background */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]"></div>
                </div>
                
                <div className="relative z-10 text-center max-w-sm">
                    <div className="inline-block p-6 bg-slate-900/60 backdrop-blur-2xl rounded-[3rem] border border-white/10 mb-8 shadow-2xl">
                        <div className="text-6xl mb-4">🔍</div>
                        <h1 className="text-2xl font-black mb-2 tracking-tighter uppercase italic">Campaign Not Found</h1>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                            We couldn't find an active campaign for <span className="text-white font-bold italic">"{tenantSlug}"</span>. It might have ended or the link could be incorrect.
                        </p>
                        <a 
                            href="/admin"
                            className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl transition-all uppercase text-[10px] tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95"
                        >
                            Visit Dashboard
                        </a>
                    </div>
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">The Lead Spin Team</p>
                </div>
            </div>
        );
    }

    // Show landing page if published
    if (showLandingPage && campaign?.id) {
        return <LandingPageRenderer campaignId={campaign.id} userId={user?.id || null} />;
    }

    return (
        <main className="min-h-screen bg-[#020617] text-white relative overflow-x-hidden flex flex-col items-center">
            {/* Premium Mesh Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[50%] bg-blue-600/10 rounded-full blur-[150px]"></div>
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[30%] bg-purple-600/5 rounded-full blur-[100px]"></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.1] mix-blend-overlay"></div>
            </div>

            {/* Dimmed overlay when login modal is shown - lighter so background is more visible */}
            {showLoginModal && !isVerified && (
                <div className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"></div>
            )}


            <div className={`relative z-10 w-full flex flex-col items-center ${showLoginModal && !isVerified ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
                {/* Mobile-Optimized Header - High Contrast */}
                {user && isVerified && (
                    <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
                        <div className="absolute inset-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none"></div>
                        
                        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-end relative z-10">
                            {/* Right: Logout Button (Hidden on mobile) */}
                            <button
                                onClick={handleLogout}
                                className="hidden md:flex h-11 px-5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-all shadow-2xl hover:scale-105 active:scale-95 items-center gap-2 border-2 border-white/20"
                                title="Logout"
                            >
                                <span className="hidden sm:inline">Logout</span>
                                <span className="text-lg">🚪</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Header & Metadata Section - Adjusted for fixed header */}
                <div className={`w-full max-w-4xl px-4 ${user && isVerified ? 'pt-16 md:pt-24' : 'pt-8 md:pt-16'} pb-6 md:pb-8 flex flex-col items-center`}>
                    <header className="text-center mb-4 md:mb-8 relative">
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <h1 className="text-2xl md:text-5xl lg:text-6xl font-black mb-2 md:mb-4 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400 bg-clip-text text-transparent uppercase tracking-tighter drop-shadow-2xl">
                                {campaign.name}
                            </h1>
                            <p className="text-slate-400 text-sm md:text-lg lg:text-xl max-w-lg mx-auto font-medium px-4">
                                {campaign.description}
                            </p>
                        </motion.div>
                    </header>

                    {/* Campaign Metadata Cards - Optimized for mobile */}
                    {user && userStatus && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="w-full max-w-2xl mb-6 md:mb-8 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3"
                        >
                            <div className="bg-slate-900/40 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-800/50 text-center">
                                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Ends</p>
                                <p className="text-[10px] md:text-xs font-bold text-amber-500">
                                    {campaign.endDate
                                        ? new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                                        : 'Ongoing'}
                                </p>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-800/50 text-center">
                                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Available</p>
                                <p className="text-[10px] md:text-xs font-bold text-blue-400">
                                    {userStatus?.totalAvailable || 0} <span className="text-[8px] md:text-[9px] text-slate-600">spins</span>
                                </p>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-800/50 text-center">
                                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Progress</p>
                                <p className="text-[10px] md:text-xs font-bold text-green-400">
                                    {userStatus?.referralsRequired > 0
                                        ? `${userStatus.referralsProgress || 0}/${userStatus.referralsRequired}`
                                        : 'N/A'
                                    }
                                </p>
                            </div>
                            <div className="bg-slate-900/40 backdrop-blur-sm p-2 md:p-3 rounded-lg md:rounded-xl border border-slate-800/50 text-center">
                                <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Next In</p>
                                <p className="text-[10px] md:text-xs font-bold text-purple-400">
                                    {userStatus?.canSpin ? 'Now!' : `${userStatus?.nextSpinInHours || 0}h`}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Main Content Grid - Optimized for mobile */}
                <div className="w-full max-w-7xl px-3 md:px-6 lg:px-8 pb-16 md:pb-20">
                   <div className="grid lg:grid-cols-12 gap-6 md:gap-8 xl:gap-12 items-start">

                        {/* Left/Main Column: Interaction Area */}
                        <div className="lg:col-span-7 xl:col-span-8 flex flex-col items-center order-1">
                            {/* Always show the spinner/wheel UI (will be dimmed when login modal is shown) */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="w-full flex flex-col items-center space-y-8 md:space-y-12"
                            >
                                        {/* Status Header */}
                                        {isRefreshingStatus ? (
                                            <div className="flex items-center space-x-4 px-6 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                                                <div className="w-3 h-3 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Checking Status...</span>
                                            </div>
                                        ) : userStatus ? (
                                            <div className="flex items-center space-x-4 px-6 py-2 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-2 h-2 rounded-full ${userStatus?.canSpin ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                        {userStatus?.canSpin ? 'Wheel Active' : 'Spins Locked'}
                                                    </span>
                                                </div>
                                                <div className="h-4 w-[1px] bg-white/10"></div>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                                    {userStatus?.totalAvailable || 0} Spins Available
                                                </span>
                                            </div>
                                        ) : statusError ? null : null}

                                        {/* Social Stats Bar */}
                                        {user && campaign && (
                                            <SocialStatsBar />
                                        )}

                                        {/* Social Tasks Panel */}
                                        {user && campaign && (
                                            <SocialTasksPanel campaignId={campaign.id} userId={user.id} />
                                        )}

                                        {/* Interaction Body - Always show spinner/wheel in background */}
                                        <AnimatePresence mode="wait">
                                            {(wonPrize && !isSpinning && user) ? (
                                                /* Result View: Above the Fold */
                                                <motion.div
                                                    key="result-view"
                                                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: -20 }}
                                                    className="w-full max-w-md"
                                                >
                                                    {(() => {
                                                        // Check if it's a loss/try again scenario
                                                        const isLoss = wonPrize.tryAgain ||
                                                            wonPrize.name.toLowerCase().includes('no prize') ||
                                                            wonPrize.name.toLowerCase().includes('no offer');
                                                        
                                                        if (isLoss) {
                                                            return (
                                                                <div className="text-center bg-slate-900/80 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-red-500/20 shadow-2xl">
                                                                    <div className="text-7xl mb-8">😔</div>
                                                                    <h2 className="text-3xl font-black mb-4 text-red-400 tracking-tighter uppercase italic">Not This Time!</h2>
                                                                    <p className="text-slate-300 mb-10 text-lg font-medium leading-relaxed">{wonPrize.message || 'Sorry, try again in some time'}</p>
                                                                    <button
                                                                        onClick={() => {
                                                                            setWonPrize(null);
                                                                            setTryAgainMessage(null);
                                                                        }}
                                                                        className="w-full py-5 bg-white/5 hover:bg-white/10 text-white font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-xs border border-white/5"
                                                                    >
                                                                        Try Another Spin
                                                                    </button>
                                                                </div>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <div className="space-y-6">
                                                                <div className="text-center bg-slate-900/60 backdrop-blur-2xl p-12 rounded-[3.5rem] border border-amber-500/30 shadow-2xl relative overflow-hidden group">
                                                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                                                                    <div className="text-7xl mb-8 transform group-hover:scale-110 transition-transform duration-700">🎉</div>
                                                                    <h2 className="text-4xl font-black mb-2 text-white tracking-tighter uppercase italic">Congratulations!</h2>
                                                                    <h3 className="text-2xl font-bold mb-10 text-amber-400">{wonPrize.name}</h3>

                                                                {wonPrize.couponCode && (
                                                                    <div className="bg-black/40 p-8 rounded-[2rem] border-2 border-amber-500/20 mb-10 backdrop-blur-sm shadow-inner">
                                                                        <p className="text-[10px] text-slate-500 uppercase font-black mb-3 tracking-[0.3em]">Activation Code</p>
                                                                        <p className="text-4xl font-mono text-amber-500 font-black tracking-tighter">{wonPrize.couponCode}</p>
                                                                    </div>
                                                                )}
                                                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                                                    Check WhatsApp for details 📱
                                                                </p>
                                                            </div>

                                                            {/* Sharing Options directly on result card */}
                                                            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-8 rounded-[3rem] shadow-xl text-center">
                                                                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">Unlock another spin by sharing!</p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <button
                                                                        onClick={() => handleShare('whatsapp')}
                                                                        className="flex items-center justify-center py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest"
                                                                    >
                                                                        WhatsApp
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleShare()}
                                                                        className="flex items-center justify-center py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all uppercase text-[10px] tracking-widest border border-white/5"
                                                                    >
                                                                        Other Apps
                                                                    </button>
                                                                </div>
                                                                <button
                                                                    onClick={() => setWonPrize(null)}
                                                                    className="mt-6 text-[10px] font-black text-slate-600 hover:text-slate-400 uppercase tracking-widest underline underline-offset-4"
                                                                >
                                                                    Return to wheel
                                                                </button>
                                                            </div>
                                                        </div>
                                                        );
                                                    })()}
                                                </motion.div>
                                            ) : user && userStatus && !userStatus.canSpin ? (
                                                /* Share unlock view - only when user is logged in but can't spin */
                                                <motion.div
                                                    key="share-unlock"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="w-full max-w-md bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-10 md:p-12 rounded-[4rem] shadow-2xl relative overflow-hidden"
                                                >
                                                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                                                    <div className="relative z-10 text-center">
                                                        <div className="inline-block p-6 bg-slate-800/80 rounded-[2.5rem] border border-white/5 mb-8 shadow-inner ring-4 ring-amber-500/20">
                                                            <div className="text-6xl grayscale opacity-50">🎡</div>
                                                            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">LOCKED</div>
                                                        </div>

                                                        <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Spins Exhausted!</h3>
                                                        <p className="text-slate-400 text-sm font-medium leading-relaxed mb-10">
                                                            {userStatus && userStatus.nextSpinInHours > 0 ? (
                                                                <>Wait <span className="text-amber-500 font-bold">{userStatus.nextSpinInHours}h</span> or unlock an <br />
                                                                <span className="text-white font-bold">instant bonus spin</span> now!</>
                                                            ) : (
                                                                <>Unlock an <span className="text-white font-bold">instant bonus spin</span> by inviting friends!</>
                                                            )}
                                                        </p>

                                                        {userStatus && userStatus.referralsRequired > 0 && (
                                                            <div className="mb-10 px-4">
                                                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                                                    <span className="text-slate-500">Referral Progress</span>
                                                                    <span className="text-amber-500">{userStatus.referralsProgress || 0} / {userStatus.referralsRequired}</span>
                                                                </div>
                                                                <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                                                                    <motion.div
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${(userStatus.referralsProgress / userStatus.referralsRequired) * 100}%` }}
                                                                        className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)]"
                                                                    ></motion.div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <button
                                                            onClick={() => handleShare('whatsapp')}
                                                            className="w-full py-6 bg-[#25D366] hover:bg-[#20ba5a] text-white font-black text-lg rounded-3xl shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all flex items-center justify-center space-x-3 group"
                                                        >
                                                            <span>INVITE FRIENDS TO UNLOCK</span>
                                                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                                                        </button>

                                                        <button
                                                            onClick={() => handleShare('copy')}
                                                            className="mt-4 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors"
                                                        >
                                                            Or copy referral link
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            ) : (
                                                /* Always show spinner/wheel - will be dimmed by parent overlay when not logged in */
                                                <motion.div
                                                    key="wheel-active"
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, scale: 0.95 }}
                                                    className="relative group flex flex-col items-center"
                                                >
                                                    <div className="absolute -inset-16 bg-amber-500/5 rounded-full blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
                                                    {prizes.length > 0 ? (
                                                        <SpinWheel
                                                            prizes={prizes}
                                                            isSpinning={isSpinning && user ? true : false}
                                                            onFinished={handleSpinFinished}
                                                            templateName={campaign.template || 'template_1'}
                                                            logoUrl={campaign.logoUrl}
                                                            selectedPrizeIndex={selectedPrizeIndex}
                                                            onTick={() => soundEffects.playTickSound()}
                                                            onSpinClick={startSpin}
                                                            disabled={!user || userStatus?.baseSpinsAvailable === 0 && userStatus?.bonusSpinsAvailable === 0}
                                                        />
                                                    ) : (
                                                        /* Show placeholder spinner when prizes are loading */
                                                        <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] mx-auto flex items-center justify-center">
                                                            <div className="w-full h-full rounded-full border-8 border-amber-500/20 animate-spin" style={{ borderTopColor: '#f59e0b' }}></div>
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <div className="text-4xl">🎡</div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {!isSpinning && !wonPrize && (
                                                        <div className="mt-8 md:mt-12 flex flex-col md:flex-row items-center justify-center gap-4 w-full max-w-4xl mx-auto relative z-10 px-4">
                                                            {/* Primary Spin Button - Optimized for responsive layout */}
                                                            <button
                                                                onClick={startSpin}
                                                                disabled={!user || !user.id || (userStatus && !userStatus.canSpin) || isRefreshingStatus}
                                                                className={`w-full md:w-fit md:min-w-[300px] py-6 px-12 font-black text-2xl rounded-3xl transition-all uppercase tracking-tighter ${
                                                                    !user || !user.id || (userStatus && !userStatus.canSpin) || isRefreshingStatus
                                                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                                                        : 'bg-gradient-to-r from-amber-600 to-amber-400 text-slate-950 shadow-[0_25px_60px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95'
                                                                }`}
                                                            >
                                                                {isRefreshingStatus 
                                                                    ? 'Loading...' 
                                                                    : !user || !user.id
                                                                        ? 'Login to Spin'
                                                                        : userStatus && !userStatus.canSpin 
                                                                            ? 'No Spins Available' 
                                                                            : 'Spin Wheel Now'}
                                                            </button>

                                                            {/* Responsive Stats Row - Side by side on mobile, row on desktop */}
                                                            <div className="flex flex-row items-center gap-3 w-full md:w-auto">
                                                                {/* Spins Remaining Badge */}
                                                                <div className="flex-1 md:w-40 bg-slate-900/60 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3 whitespace-nowrap">
                                                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500">
                                                                        <span className="material-symbols-outlined !text-[18px]">toll</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Remaining</span>
                                                                        <span className="text-sm font-black text-white leading-none">{userStatus?.totalAvailable || 0} Spins</span>
                                                                    </div>
                                                                </div>

                                                                {/* Joined Users Badge */}
                                                                <div className="flex-1 md:w-40 bg-slate-900/60 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/10 shadow-lg flex items-center gap-3 whitespace-nowrap">
                                                                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500">
                                                                        <span className="material-symbols-outlined !text-[18px]">group</span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">Joined</span>
                                                                        <span className="text-sm font-black text-white leading-none">{leaders?.length || 0} Users</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Result Display - REMOVED from bottom to put above fold */}

                                        {!wonPrize && !isSpinning && !userStatus?.canSpin && user && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="text-center"
                                            >
                                                <p className="text-[10px] text-slate-600 font-black tracking-[0.4em] uppercase">Limited Spins - Share to Continue!</p>
                                            </motion.div>
                                        )}
                            </motion.div>
                        </div>

                        {/* Right Column: Rankings & Profiles */}
                        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-8 order-2">
                            {/* Leaderboard Section */}
                            {campaign && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="bg-slate-900/60 backdrop-blur-2xl rounded-[3.5rem] border border-white/10 shadow-2xl overflow-hidden"
                                >
                                    <div className="p-10 bg-gradient-to-br from-white/5 to-transparent">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-2xl font-black text-amber-500 tracking-tighter uppercase italic">
                                                🏆 Rankings
                                            </h2>
                                            <div className="px-3 py-1 bg-amber-500/10 rounded-full border border-amber-500/20">
                                                <span className="text-[10px] text-amber-500 font-black uppercase tracking-[0.2em] animate-pulse">Live</span>
                                            </div>
                                        </div>
                                        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">Recent Winners Hall</p>
                                    </div>
                                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar px-4 pb-8">
                                        <div className="space-y-3">
                                            {leaders.length === 0 ? (
                                                <div className="py-16 text-center">
                                                    <div className="text-5xl mb-6 opacity-20">🏆</div>
                                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Be the first winner!</p>
                                                </div>
                                            ) : (
                                                leaders.map((l, i) => (
                                                    <div
                                                        key={l.id}
                                                        className={`p-5 rounded-3xl border transition-all flex items-center gap-4 ${user?.id === l.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/30 border-white/5 hover:bg-slate-800/50'}`}
                                                    >
                                                        <div className="w-12 h-12 flex items-center justify-center rounded-2xl bg-black/40 font-black text-lg">
                                                            {i < 3 ? (
                                                                <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                                            ) : (
                                                                <span className="text-slate-600 text-sm">#{i + 1}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-white text-sm tracking-tight">{l.name || 'Anonymous'}</p>
                                                            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{l.totalSpins} spins</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-lg font-black text-green-400 leading-none">{l.wins}</p>
                                                            <p className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Wins</p>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Condensed Session info */}
                            {user && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-6 bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/10 flex items-center justify-between"
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className="w-10 h-10 bg-slate-800/80 rounded-2xl border border-white/5 flex items-center justify-center text-lg shadow-inner">👤</div>
                                        <div>
                                            <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Session</p>
                                            <p className="text-sm font-black text-white tracking-tight">{user.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all border border-red-500/10 shadow-lg active:scale-95"
                                        title="Logout"
                                    >
                                        <div className="text-xs">🚪</div>
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Modal Overlay - Centered Card */}
            {showLoginModal && !isVerified && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-md"
                    >
                        <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
                            {/* Abstract background blobs for premium feel */}
                            <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                            <div className="relative z-10 text-center mb-10">
                                <div className="inline-block p-4 bg-slate-800/80 rounded-3xl border border-white/5 mb-6 shadow-inner transform group-hover:scale-110 transition-transform duration-700">
                                    <div className="text-5xl">🎡</div>
                                </div>
                                <h3 className="text-3xl font-black text-white mb-3 tracking-tighter uppercase italic">Ready to Spin?</h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-[240px] mx-auto">
                                    Verify your details to unlock <br /> <span className="text-amber-500 font-bold">exclusive rewards</span> instantly!
                                </p>
                            </div>

                            <div className="relative z-10 px-2">
                                <OTPForm onSendOTP={handleSendOTP} onVerify={handleVerifyOTP} />
                            </div>
                        </div>

                        <p className="text-center mt-8 text-[10px] text-slate-400 uppercase font-black tracking-[0.3em]">Secure Verification via WhatsApp</p>
                    </motion.div>
                </div>
            )}

            {/* Sticky Support Contact */}
            {campaign.supportMobile && (
                <div className="fixed bottom-6 right-6 z-50">
                    <button
                        onClick={() => setShowSupportModal((v) => !v)}
                        className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-full shadow-[0_0_20px_rgba(22,163,74,0.4)] flex items-center justify-center hover:scale-110 transition-all group text-white font-black text-sm uppercase tracking-tighter"
                    >
                        Support 💬
                    </button>

                    {showSupportModal && (
                        <div className="absolute bottom-16 right-0 bg-slate-900/95 text-white rounded-2xl shadow-xl border border-white/10 p-4 w-64 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-black">Support</p>
                                <button
                                    onClick={() => setShowSupportModal(false)}
                                    className="text-slate-400 hover:text-white text-xs"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Phone</span>
                                    <span className="font-bold">{campaign.supportMobile}</span>
                                </div>
                                {campaign.websiteUrl && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-slate-400">Website</span>
                                        <a
                                            href={campaign.websiteUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-amber-400 font-bold underline underline-offset-2"
                                        >
                                            Open
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <PrizeModal
                isOpen={showPrizeModal}
                prize={wonPrize}
                onClose={() => setShowPrizeModal(false)}
                onWhatsAppShare={shareOnWhatsApp}
                campaignName={campaign.name}
                referralCode={user?.referralCode}
                shareUrl={shareUrl}
            />
        </main >
    );
}
