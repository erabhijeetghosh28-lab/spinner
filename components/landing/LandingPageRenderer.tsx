'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import Template1 from './templates/Template1';
import Template2 from './templates/Template2';
import Template3 from './templates/Template3';
import Template4 from './templates/Template4';
import Template5 from './templates/Template5';
import OTPForm from '@/components/OTPForm';

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

    useEffect(() => {
        fetchLandingPage();
        // Check if user is already verified (from localStorage)
        const storedUser = localStorage.getItem('offer-wheel-user');
        const storedExpiry = localStorage.getItem('offer-wheel-user-expiry');
        if (storedUser && storedExpiry) {
            const expiryTime = parseInt(storedExpiry);
            if (Date.now() < expiryTime) {
                try {
                    const userData = JSON.parse(storedUser);
                    setIsVerified(true);
                    setVerifiedUserId(userData.id);
                } catch (e) {
                    // Invalid stored data, clear it
                    localStorage.removeItem('offer-wheel-user');
                    localStorage.removeItem('offer-wheel-user-expiry');
                }
            } else {
                // Expired, clear it
                localStorage.removeItem('offer-wheel-user');
                localStorage.removeItem('offer-wheel-user-expiry');
            }
        }
    }, [campaignId, userId]);

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

            // Save user with 5-minute expiry
            const expiryTime = Date.now() + (5 * 60 * 1000); // 5 minutes
            localStorage.setItem('offer-wheel-user', JSON.stringify(userData));
            localStorage.setItem('offer-wheel-user-expiry', expiryTime.toString());
        } catch (err: any) {
            throw err;
        }
    };

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

    // Show OTP form if not verified
    if (!isVerified) {
        return (
            <div className="min-h-screen bg-[#f8f7f5] flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-black text-[#181411] mb-2">Welcome!</h2>
                            <p className="text-[#8a7560] text-sm">Enter your details to continue</p>
                        </div>
                        <OTPForm onSendOTP={handleSendOTP} onVerify={handleVerifyOTP} />
                    </div>
                </div>
            </div>
        );
    }

    const template = landingPage.template || 'template_1';
    const campaign = landingPage.campaign;

    // Render based on template
    return (
        <div className="relative">
            {/* Visual indicator banner (admin only - can be hidden in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-bold">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        Landing Page Active ({template})
                    </div>
                </div>
            )}
            {template === 'template_1' && (
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
        </div>
    );
}
