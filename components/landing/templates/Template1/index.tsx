'use client';

import Template1Hero from './Hero';
import Template1Offers from './Offers';
import Template1Newsletter from './Newsletter';
import Template1Footer from './Footer';

interface Template1Props {
    landingPage: any;
    campaign: any;
    userId?: string | null;
}

export default function Template1({ landingPage, campaign, userId }: Template1Props) {
    const sections = landingPage?.sections || [];
    const offers = landingPage?.offers || [];
    const footer = landingPage?.footer;

    // Find hero section
    const heroSection = sections.find((s: any) => s.type === 'HERO');

    return (
        <div className="layout-container flex h-full grow flex-col">
            <main className="flex flex-1 flex-col items-center w-full">
                {/* Hero Section */}
                {heroSection && (
                    <Template1Hero
                        section={heroSection}
                        campaign={campaign}
                        userId={userId}
                    />
                )}

                {/* Offers Section */}
                <Template1Offers
                    offers={offers}
                />

                {/* Newsletter Section */}
                <Template1Newsletter />
            </main>

            {/* Footer */}
            <Template1Footer
                footer={footer}
                campaign={campaign}
            />
        </div>
    );
}
