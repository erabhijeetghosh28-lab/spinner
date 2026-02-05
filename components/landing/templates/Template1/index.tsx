'use client';

import Footer from './Footer';
import Hero from './Hero';
import Newsletter from './Newsletter';
import Offers from './Offers';

interface Template1Props {
    landingPage: any;
    campaign: any;
    userId?: string | null;
}

export default function Template1({ landingPage, campaign, userId }: Template1Props) {
    // Extract sections
    const heroSection = landingPage?.sections?.find((s: any) => s.type === 'HERO');
    
    return (
        <div className="bg-[#f8f7f5] min-h-screen font-['Plus_Jakarta_Sans',sans-serif]">
            <Hero 
                section={heroSection} 
                campaign={campaign} 
                userId={userId}
                landingPage={landingPage}
            />
            <Offers offers={landingPage?.offers || []} />
            <Newsletter />
            <Footer 
                footer={landingPage?.campaignFooter} 
                tenantSlug={campaign?.tenant?.slug}
            />
        </div>
    );
}
