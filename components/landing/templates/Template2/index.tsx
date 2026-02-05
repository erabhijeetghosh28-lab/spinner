'use client';

import Template2Footer from './Footer';
import Template2Hero from './Hero';
import Template2Newsletter from './Newsletter';
import Template2Offers from './Offers';

interface Template2Props {
    landingPage: any;
    campaign: any;
    userId?: string | null;
}

export default function Template2({ landingPage, campaign, userId }: Template2Props) {
    const sections = landingPage?.sections || [];
    const offers = landingPage?.offers || [];
    const footer = landingPage?.footer;

    const heroSection = sections.find((s: any) => s.type === 'HERO');

    return (
        <div className="layout-container flex h-full grow flex-col bg-template2-navy-dark text-white">
            <main className="flex flex-1 flex-col items-center w-full">
                {heroSection && (
                    <Template2Hero
                        section={heroSection}
                        campaign={campaign}
                        userId={userId}
                    />
                )}

                <Template2Offers
                    offers={offers}
                />

                <Template2Newsletter />
            </main>

            <Template2Footer
                footer={footer}
                campaign={campaign}
                tenantSlug={campaign?.tenant?.slug}
            />
        </div>
    );
}
