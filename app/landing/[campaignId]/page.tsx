'use client';

import React from 'react';
import LandingPageRenderer from '@/components/landing/LandingPageRenderer';
import { useParams } from 'next/navigation';

export default function LandingPage() {
    const params = useParams();
    const campaignId = params?.campaignId as string;

    if (!campaignId) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-2">Invalid Campaign ID</p>
                    <p className="text-slate-400 text-sm">Please check the URL</p>
                </div>
            </div>
        );
    }

    return <LandingPageRenderer campaignId={campaignId} />;
}
