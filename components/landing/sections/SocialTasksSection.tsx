'use client';

import React from 'react';
import SocialTasksPanel from '@/components/SocialTasksPanel';

interface SocialTasksSectionProps {
    section: any;
    campaignId: string;
    brandColor: string;
}

export default function SocialTasksSection({ section, campaignId, brandColor }: SocialTasksSectionProps) {
    const content = section.content || {};
    const title = content.title || 'Earn Extra Spins';
    const description = content.description || 'Complete social media tasks to get bonus spins!';

    // This section will render the existing SocialTasksPanel component
    // We need to get the userId from context or props
    // For now, we'll render a placeholder that shows when user is logged in

    return (
        <section className="py-20 px-4 bg-slate-800/30">
            <div className="container mx-auto max-w-7xl">
                <div className="text-center mb-12">
                    <h2 
                        className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: brandColor }}
                    >
                        {title}
                    </h2>
                    <p className="text-xl text-slate-400">{description}</p>
                </div>

                {/* Note: SocialTasksPanel requires userId, so this will be rendered conditionally in the main page */}
                <div className="max-w-2xl mx-auto">
                    <div className="bg-slate-900/50 rounded-2xl p-8 border border-slate-700 text-center">
                        <p className="text-slate-400 mb-4">
                            Social tasks will appear here when you're logged in.
                        </p>
                        <p className="text-sm text-slate-500">
                            Complete tasks to earn bonus spins instantly!
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
