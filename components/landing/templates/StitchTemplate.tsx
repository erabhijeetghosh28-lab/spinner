'use client';

import FooterSection from '../sections/FooterSection';
import StitchFeaturedSection from '../sections/StitchFeaturedSection';
import StitchHeroSection from '../sections/StitchHeroSection';

interface StitchTemplateProps {
    landingPage: any;
    campaign: any;
}

export default function StitchTemplate({ landingPage, campaign }: StitchTemplateProps) {
    const brandColor = landingPage.brandColor || '#f48c25';
    const offers = landingPage.offers || [];
    const footer = landingPage.footer;

    return (
        <div className="min-h-screen bg-background-light dark:bg-background-dark text-[#181411] dark:text-white transition-colors duration-300 font-display">
            <main className="flex flex-1 flex-col items-center">
                {/* Hero Section */}
                <StitchHeroSection 
                    campaign={campaign}
                    primaryColor={brandColor}
                />
                
                {/* Featured Highlights (Offers) Section */}
                <StitchFeaturedSection 
                    offers={offers}
                    brandColor={brandColor}
                />

                {/* Newsletter / Join Section */}
                <section className="w-full py-20 px-6" style={{ backgroundColor: brandColor }}>
                    <div className="max-w-[800px] mx-auto text-center flex flex-col gap-6">
                        <h2 className="text-white text-4xl font-black">Join the Brand Revolution</h2>
                        <p className="text-white/80 text-lg">Be the first to hear about our next campaign and exclusive product highlights.</p>
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <input 
                                className="flex-1 h-14 rounded-xl px-6 border-none focus:ring-2 focus:ring-white/50 text-black placeholder-gray-500" 
                                placeholder="Enter your email" 
                                type="email"
                            />
                            <button className="h-14 px-10 rounded-xl bg-[#1e293b] text-white font-bold hover:bg-[#334155] transition-colors shadow-xl">
                                Get Early Access
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            {footer && (
                <FooterSection 
                    footer={footer}
                    brandColor={brandColor}
                />
            )}
        </div>
    );
}
