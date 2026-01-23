'use client';

import Template5Hero from './Hero';
import Template5Offers from './Offers';
import Template5Newsletter from './Newsletter';
import Template5Footer from './Footer';

interface Template5Props {
    landingPage: any;
    campaign: any;
    userId?: string | null;
}

export default function Template5({ landingPage, campaign, userId }: Template5Props) {
    const sections = landingPage?.sections || [];
    const offers = landingPage?.offers || [];
    const footer = landingPage?.footer;

    const heroSection = sections.find((s: any) => s.type === 'HERO');

    return (
        <div className="layout-container flex h-full grow flex-col bg-template5-background-light text-black">
            <main className="flex flex-1 flex-col items-center w-full">
                {heroSection && (
                    <Template5Hero
                        section={heroSection}
                        campaign={campaign}
                        userId={userId}
                    />
                )}

                <Template5Offers
                    offers={offers}
                />

                <Template5Newsletter />
            </main>

            <Template5Footer
                footer={footer}
                campaign={campaign}
            />
        </div>
    );
}
