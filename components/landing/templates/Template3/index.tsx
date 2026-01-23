'use client';

import Template3Hero from './Hero';
import Template3Offers from './Offers';
import Template3Newsletter from './Newsletter';
import Template3Footer from './Footer';

interface Template3Props {
    landingPage: any;
    campaign: any;
    userId?: string | null;
}

export default function Template3({ landingPage, campaign, userId }: Template3Props) {
    const sections = landingPage?.sections || [];
    const offers = landingPage?.offers || [];
    const footer = landingPage?.footer;

    const heroSection = sections.find((s: any) => s.type === 'HERO');

    return (
        <div className="layout-container flex h-full grow flex-col bg-template3-cream text-[#2C241D]">
            <main className="flex flex-1 flex-col items-center w-full">
                {heroSection && (
                    <Template3Hero
                        section={heroSection}
                        campaign={campaign}
                        userId={userId}
                    />
                )}

                <Template3Offers
                    offers={offers}
                />

                <Template3Newsletter />
            </main>

            <Template3Footer
                footer={footer}
                campaign={campaign}
            />
        </div>
    );
}
