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

export default function Template5Offers({ offers }: OffersProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Template 5 primary color from reference HTML
    const primaryColor = '#FF0800';

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
        <section className="w-full bg-white dark:bg-zinc-900 py-24 border-y border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col gap-4 mb-16 text-center">
                    <h2 className="text-black dark:text-white text-5xl font-black tracking-tighter uppercase">Featured Highlights</h2>
                    <div className="h-1.5 w-32 bg-template5-primary mx-auto"></div>
                </div>
                <div className="relative group">
                    <div className="absolute top-1/2 -left-6 -translate-y-1/2 z-20">
                        <button onClick={() => scrollToIndex(currentIndex > 0 ? currentIndex - 1 : displayOffers.length - 1)} className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-black hover:bg-template5-primary hover:text-white transition-all border border-gray-100">
                            <span className="material-symbols-outlined">west</span>
                        </button>
                    </div>
                    <div className="absolute top-1/2 -right-6 -translate-y-1/2 z-20">
                        <button onClick={() => scrollToIndex(currentIndex < displayOffers.length - 1 ? currentIndex + 1 : 0)} className="w-14 h-14 rounded-full bg-white shadow-xl flex items-center justify-center text-black hover:bg-template5-primary hover:text-white transition-all border border-gray-100">
                            <span className="material-symbols-outlined">east</span>
                        </button>
                    </div>
                    <div ref={scrollContainerRef} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-0" onScroll={(e) => {
                        const container = e.currentTarget;
                        const index = Math.round(container.scrollLeft / container.offsetWidth);
                        setCurrentIndex(index);
                    }}>
                        {displayOffers.map((offer) => (
                            <div key={offer.id} className="flex-none w-full snap-center px-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 bg-gray-50 dark:bg-black min-h-[550px] border border-gray-200 dark:border-zinc-800">
                                    <div className="relative overflow-hidden group/img min-h-[300px] lg:min-h-full">
                                        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${offer.image || offer.imageUrl}')` }}></div>
                                        <div className="absolute inset-0 bg-black/20"></div>
                                    </div>
                                    <div className="p-12 lg:p-20 flex flex-col justify-center gap-8">
                                        <div className="text-template5-primary font-black uppercase tracking-[0.3em] text-xs">Innovation Insight</div>
                                        <h3 className="text-black dark:text-white text-5xl font-black leading-[1.1] uppercase tracking-tighter">{offer.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{offer.description}</p>
                                        {offer.features && offer.features.length > 0 && (
                                            <div className="grid grid-cols-1 gap-4">
                                                {offer.features.map((feature, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-black dark:text-white font-bold text-sm uppercase tracking-wider">
                                                        <span className="w-2 h-2 bg-template5-primary"></span>
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
                    <div className="flex justify-center gap-3 mt-12">
                        {displayOffers.map((_, index) => (
                            <div key={index} className={`w-16 h-1.5 ${index === currentIndex ? 'bg-template5-primary' : 'bg-gray-200 dark:bg-zinc-800'}`} onClick={() => scrollToIndex(index)}></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
