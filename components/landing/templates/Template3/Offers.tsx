'use client';

import { useRef, useState } from 'react';

interface Offer {
    id: string;
    title: string;
    description: string;
    image: string;
    imageUrl?: string;
    badge?: string;
    category?: string;
    features?: string[];
}

interface OffersProps {
    offers: Offer[];
}

export default function Template3Offers({ offers }: OffersProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Template 3 primary color from reference HTML
    const primaryColor = '#D4AF37';

    const getFeaturesForOffer = (offer: Offer): string[] => {
        if (offer.features) return offer.features;
        const categoryFeatures: { [key: string]: string[] } = {
            'Audio': ['Active Noise Cancellation (ANC)', '48-Hour Hybrid Battery Life', 'Sustainable Recycled Materials'],
            'Wearables': ['Next-Gen Heart Rate Sensor', 'Sapphire Crystal Durability', 'Always-On Retina Display'],
        };
        return categoryFeatures[offer.category || ''] || [];
    };

    const getBadgeForOffer = (offer: Offer): string => {
        if (offer.badge) return offer.badge;
        const categoryBadges: { [key: string]: string } = {
            'Audio': 'New Innovation',
            'Wearables': 'Wellness Tech',
        };
        return categoryBadges[offer.category || ''] || '';
    };

    const displayOffers = offers.length > 0 ? offers.map(offer => ({
        ...offer,
        imageUrl: offer.image || offer.imageUrl,
        badge: getBadgeForOffer(offer),
        features: getFeaturesForOffer(offer),
    })) : [];

    const scrollToIndex = (index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            container.scrollTo({ left: index * container.offsetWidth, behavior: 'smooth' });
            setCurrentIndex(index);
        }
    };

    return (
        <section className="w-full bg-template3-beige-light dark:bg-[#1f1a16] py-24 overflow-hidden border-b border-template3-primary/10">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col items-center text-center gap-4 mb-16">
                    <span className="text-template3-primary font-bold uppercase tracking-[0.3em] text-xs">The Collection</span>
                    <h2 className="text-[#181411] dark:text-white text-4xl md:text-5xl font-serif font-bold">Featured Highlights</h2>
                    <div className="h-0.5 w-24 bg-template3-primary/40 mt-2"></div>
                </div>
                <div className="relative group">
                    <div className="absolute top-1/2 -left-6 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => scrollToIndex(currentIndex > 0 ? currentIndex - 1 : displayOffers.length - 1)} className="w-14 h-14 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-template3-primary/20 flex items-center justify-center text-template3-primary hover:bg-template3-primary hover:text-white transition-all shadow-lg">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                    </div>
                    <div className="absolute top-1/2 -right-6 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => scrollToIndex(currentIndex < displayOffers.length - 1 ? currentIndex + 1 : 0)} className="w-14 h-14 bg-white/80 dark:bg-white/10 backdrop-blur-md border border-template3-primary/20 flex items-center justify-center text-template3-primary hover:bg-template3-primary hover:text-white transition-all shadow-lg">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div ref={scrollContainerRef} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-0" onScroll={(e) => {
                        const container = e.currentTarget;
                        const index = Math.round(container.scrollLeft / container.offsetWidth);
                        setCurrentIndex(index);
                    }}>
                        {displayOffers.map((offer) => (
                            <div key={offer.id} className="flex-none w-full snap-center px-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-[#1A1612] shadow-2xl min-h-[550px] border border-template3-primary/10">
                                    <div className="relative overflow-hidden group/img h-[400px] lg:h-auto">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover/img:scale-110" style={{ backgroundImage: `url('${offer.image || offer.imageUrl}')` }}></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                        {offer.badge && (
                                            <div className="absolute bottom-10 left-10">
                                                <span className="bg-template3-primary/90 px-4 py-1.5 text-[10px] font-bold text-white uppercase tracking-[0.2em]">{offer.badge}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6 md:p-16 flex flex-col justify-center gap-8 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] dark:bg-none">
                                        <h3 className="text-[#181411] dark:text-white text-2xl md:text-4xl font-serif font-bold leading-tight">{offer.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 text-lg font-light leading-relaxed">{offer.description}</p>
                                        {offer.features && offer.features.length > 0 && (
                                            <div className="space-y-4">
                                                {offer.features.map((feature, idx) => (
                                                    <div key={idx} className="flex items-center gap-4 text-gray-600 dark:text-gray-400">
                                                        <span className="material-symbols-outlined text-template3-primary !text-[20px]">check_circle</span>
                                                        <span className="text-sm font-medium uppercase tracking-wide">{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-4 mt-12">
                        {displayOffers.map((_, index) => (
                            <div key={index} className={`w-10 h-1 ${index === currentIndex ? 'bg-template3-primary' : 'bg-template3-primary/20 hover:bg-template3-primary/40 transition-colors cursor-pointer'}`} onClick={() => scrollToIndex(index)}></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
