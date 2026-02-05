'use client';

import OTPForm from '@/components/OTPForm';
import axios from 'axios';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import StitchTemplate from './templates/StitchTemplate';
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
import Template3 from './templates/Template3';
import Template4 from './templates/Template4';
import Template5 from './templates/Template5';

interface LandingPageRendererProps {
    campaignId: string;
    userId?: string | null;
}

export default function LandingPageRenderer({ campaignId, userId }: LandingPageRendererProps) {
    const [landingPage, setLandingPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);
    const [verifiedUserId, setVerifiedUserId] = useState<string | null>(userId || null);
    const [showLoginModal, setShowLoginModal] = useState(true);

    // Check for saved session on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('offer-wheel-user');
        const savedExpiry = localStorage.getItem('offer-wheel-user-expiry');
        
        if (savedUser && savedExpiry) {
            const expiryTime = parseInt(savedExpiry);
            const now = Date.now();
            
            // If session hasn't expired, restore it
            if (now < expiryTime) {
                const userData = JSON.parse(savedUser);
                setVerifiedUserId(userData.id);
                setIsVerified(true);
                setShowLoginModal(false);
            } else {
                // Expired session - clear it
                localStorage.removeItem('offer-wheel-user');
                localStorage.removeItem('offer-wheel-user-expiry');
            }
        }
    }, []);

    useEffect(() => {
        fetchLandingPage();
        // REMOVED: localStorage check - always show login screen per requirements
        // User must login every time they visit, even if they have a saved session
    }, [campaignId]);

    const fetchLandingPage = async () => {
        try {
            const res = await axios.get(`/api/landing-page/${campaignId}`);
            setLandingPage(res.data.landingPage);
        } catch (err: any) {
            console.error('Error fetching landing page:', err);
            setError(err.response?.data?.error || 'Failed to load landing page');
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (phone: string) => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tenantSlug = params.get('tenant') || landingPage?.campaign?.tenant?.slug || 'default';
            await axios.post('/api/otp/send', { phone, tenantSlug });
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleVerifyOTP = async (phone: string, otp: string, name?: string) => {
        try {
            const params = new URLSearchParams(window.location.search);
            const tenantSlug = params.get('tenant') || landingPage?.campaign?.tenant?.slug || 'default';
            const referralCode = params.get('ref') || null;

            const response = await axios.post('/api/otp/verify', {
                phone,
                otp,
                name,
                referralCode,
                tenantSlug
            });

            const userData = response.data.user;
            setIsVerified(true);
            setVerifiedUserId(userData.id);
            
            // Hide login modal immediately after successful login
            setShowLoginModal(false);

            // Save user with 24-hour idle expiry
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('offer-wheel-user', JSON.stringify(userData));
            localStorage.setItem('offer-wheel-user-expiry', expiryTime.toString());
        } catch (err: any) {
            throw err;
        }
    };

    const handleLogout = () => {
        setIsVerified(false);
        setVerifiedUserId(null);
        setShowLoginModal(true);
        localStorage.removeItem('offer-wheel-user');
        localStorage.removeItem('offer-wheel-user-expiry');
    };

    // Auto-logout after 1 minute of inactivity (no user action)
    useEffect(() => {
        if (!verifiedUserId || !isVerified) return;

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
                handleLogout();
                return;
            }

            const expiryTime = parseInt(savedExpiry);
            const now = Date.now();

            if (now >= expiryTime) {
                // Session expired due to inactivity - log out user
                handleLogout();
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
            
            const expiryTime = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            localStorage.setItem('offer-wheel-user-expiry', expiryTime.toString());
        };

        // Add event listeners for user activity
        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true });
        });

        // Check immediately
        checkSessionExpiry();

        // Check every 5 seconds for expiry
        const interval = setInterval(checkSessionExpiry, 5 * 1000);

        return () => {
            // Cleanup event listeners
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity);
            });
            if (activityTimeout) clearTimeout(activityTimeout);
            clearInterval(interval);
        };
    }, [verifiedUserId, isVerified]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading landing page...</p>
                </div>
            </div>
        );
    }

    if (error || !landingPage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-2">Error loading landing page</p>
                    <p className="text-slate-400 text-sm">{error || 'Landing page not found'}</p>
                </div>
            </div>
        );
    }

    const template = landingPage?.template || 'template_1';
    const campaign = landingPage?.campaign;

    // Render based on template - always show content in background
    return (
        <div className="relative min-h-screen">
            {/* Dimmed overlay when login modal is shown - lighter so background is more visible */}
            {showLoginModal && !isVerified && (
                <div className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"></div>
            )}


            {/* Visual indicator banner (Moved to avoid overlap) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-4 left-4 z-[60] px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full backdrop-blur-md">
                    <div className="flex items-center gap-2 text-green-400 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                        {template}
                    </div>
                </div>
            )}

            {/* Mobile-Optimized Header - High Contrast for Visibility */}
            {verifiedUserId && isVerified && (
                <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
                    {/* Dark gradient for text visibility on light backgrounds */}
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

            {/* Landing Page Content - Always visible, dimmed when login modal is shown */}
            <div className={`relative z-10 ${showLoginModal && !isVerified ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
                {(template === 'template_1' || template === 'Classic') && (
                    <Template1
                        landingPage={landingPage}
                        campaign={campaign}
                        userId={verifiedUserId}
                    />
                )}
                {template === 'template_2' && (
                    <Template2
                        landingPage={landingPage}
                        campaign={campaign}
                        userId={verifiedUserId}
                    />
                )}
                {template === 'template_3' && (
                    <Template3
                        landingPage={landingPage}
                        campaign={campaign}
                        userId={verifiedUserId}
                    />
                )}
                {template === 'template_4' && (
                    <Template4
                        landingPage={landingPage}
                        campaign={campaign}
                        userId={verifiedUserId}
                    />
                )}
                {template === 'template_5' && (
                    <Template5
                        landingPage={landingPage}
                        campaign={campaign}
                        userId={verifiedUserId}
                    />
                )}
                {template === 'stitch' && (
                    <StitchTemplate
                        landingPage={landingPage}
                        campaign={campaign}
                        userId={verifiedUserId}
                    />
                )}
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
                        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 relative overflow-hidden">
                            <div className="text-center mb-8">
                                <h2 className="text-3xl font-black text-[#181411] mb-2">Welcome!</h2>
                                <p className="text-[#8a7560] text-sm">Enter your details to continue</p>
                            </div>
                            <OTPForm onSendOTP={handleSendOTP} onVerify={handleVerifyOTP} />
                        </div>
                        <p className="text-center mt-4 text-[10px] text-gray-500 uppercase font-black tracking-[0.3em]">Secure Verification via WhatsApp</p>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
