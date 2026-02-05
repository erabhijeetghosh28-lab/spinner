'use client';

import Template4Footer from './Footer';
import Template4Hero from './Hero';
import Template4Newsletter from './Newsletter';
import Template4Offers from './Offers';

interface Template4Props {
    landingPage: any;
    campaign: any;
    userId?: string | null;
}

export default function Template4({ landingPage, campaign, userId }: Template4Props) {
    const sections = landingPage?.sections || [];
    const offers = landingPage?.offers || [];
    const footer = landingPage?.footer;

    const heroSection = sections.find((s: any) => s.type === 'HERO');

    return (
        <div className="layout-container flex h-full grow flex-col bg-template4-mint text-[#2D3436]">
            <main className="flex flex-1 flex-col items-center w-full">
                {heroSection && (
                    <Template4Hero
                        section={heroSection}
                        campaign={campaign}
                        userId={userId}
                    />
                )}

                <Template4Offers
                    offers={offers}
                />

                <Template4Newsletter />
            </main>

            <Template4Footer
                footer={footer}
                campaign={campaign}
                tenantSlug={campaign?.tenant?.slug}
            />
        </div>
    );
}
