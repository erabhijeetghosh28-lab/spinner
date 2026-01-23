'use client';

import { useState, useRef } from 'react';

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

export default function Template4Offers({ offers }: OffersProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Template 4 primary color from reference HTML
    const primaryColor = '#2D5A47';

    const getFeaturesForOffer = (offer: Offer): string[] => {
        if (offer.features) return offer.features;
        const categoryFeatures: { [key: string]: string[] } = {
            'Audio': ['Active Noise Cancellation (ANC)', '48-Hour Hybrid Battery Life', 'Sustainable Recycled Materials'],
            'Wearables': ['Next-Gen Heart Rate Sensor', 'Sapphire Crystal Durability', 'Always-On Retina Display'],
        };
        return categoryFeatures[offer.category || ''] || ['Premium Quality', 'Eco-Friendly', 'Lifetime Warranty'];
    };

    const getBadgeForOffer = (offer: Offer): string => {
        if (offer.badge) return offer.badge;
        const categoryBadges: { [key: string]: string } = {
            'Audio': 'New Innovation',
            'Wearables': 'Wellness Tech',
        };
        return categoryBadges[offer.category || ''] || 'Featured';
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
        <section className="w-full bg-template4-primary py-20 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col gap-4 mb-12">
                    <h2 className="text-white text-4xl font-black tracking-tight">Featured Highlights</h2>
                    <div className="h-1 w-24 bg-template4-accent rounded-full"></div>
                </div>
                <div className="relative group">
                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => scrollToIndex(currentIndex > 0 ? currentIndex - 1 : displayOffers.length - 1)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-template4-accent hover:border-template4-accent transition-all">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                    </div>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => scrollToIndex(currentIndex < displayOffers.length - 1 ? currentIndex + 1 : 0)} className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-template4-accent hover:border-template4-accent transition-all">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                    <div ref={scrollContainerRef} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-8 pb-10" onScroll={(e) => {
                        const container = e.currentTarget;
                        const index = Math.round(container.scrollLeft / container.offsetWidth);
                        setCurrentIndex(index);
                    }}>
                        {displayOffers.map((offer) => (
                            <div key={offer.id} className="flex-none w-full snap-center">
                                <div className="grid grid-cols-1 lg:grid-cols-2 bg-white/5 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-sm min-h-[500px]">
                                    <div className="relative overflow-hidden group/img">
                                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-110" style={{ backgroundImage: `url('${offer.image || offer.imageUrl}')` }}></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-template4-primary/80 to-transparent"></div>
                                        <div className="absolute bottom-8 left-8">
                                            <span className="bg-template4-accent px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest">{offer.badge}</span>
                                        </div>
                                    </div>
                                    <div className="p-12 flex flex-col justify-center gap-6">
                                        <h3 className="text-white text-4xl font-black leading-tight">{offer.title}</h3>
                                        <p className="text-template4-mint/80 text-lg leading-relaxed">{offer.description}</p>
                                        {offer.features && offer.features.length > 0 && (
                                            <div className="flex flex-col gap-4 mt-4">
                                                {offer.features.map((feature, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-template4-mint/60">
                                                        <span className="material-symbols-outlined text-template4-accent">spa</span>
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                        {displayOffers.map((_, index) => (
                            <div key={index} className={`w-12 h-1 rounded-full ${index === currentIndex ? 'bg-template4-accent' : 'bg-white/20'}`} onClick={() => scrollToIndex(index)}></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
