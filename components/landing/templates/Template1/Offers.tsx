'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface Offer {
    id: string;
    title: string;
    description: string;
    shortDescription?: string;
    image: string;
    imageUrl?: string; // For backward compatibility
    badge?: string;
    category?: string;
    features?: string[];
    originalValue?: string;
    discountValue?: string;
}

interface OffersProps {
    offers: Offer[];
}

export default function Template1Offers({ offers }: OffersProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    // Template 1 primary color from reference HTML
    const primaryColor = '#f48c25';

    // Map offers to include features based on category/badge
    const getFeaturesForOffer = (offer: Offer): string[] => {
        if (offer.features) return offer.features;
        
        // Default features based on category
        const categoryFeatures: { [key: string]: string[] } = {
            'Audio': ['Active Noise Cancellation (ANC)', '48-Hour Hybrid Battery Life', 'Sustainable Recycled Materials'],
            'Wearables': ['Next-Gen Heart Rate Sensor', 'Sapphire Crystal Durability', 'Always-On Retina Display'],
            'Lifestyle': ['Hand-Blown Glass', 'Precision Pour Spout', 'Zero-Waste Coffee Filter'],
        };
        
        return categoryFeatures[offer.category || ''] || ['Premium Quality', 'Eco-Friendly', 'Lifetime Warranty'];
    };

    const getBadgeForOffer = (offer: Offer): string => {
        if (offer.badge) return offer.badge;
        const categoryBadges: { [key: string]: string } = {
            'Audio': 'New Arrival',
            'Wearables': 'Innovation',
            'Lifestyle': 'Sustainability',
        };
        return categoryBadges[offer.category || ''] || 'Featured';
    };

    // Default offers if none provided (for demo)
    const displayOffers = offers.length > 0 ? offers.map(offer => ({
        ...offer,
        imageUrl: offer.image || offer.imageUrl,
        badge: getBadgeForOffer(offer),
        features: getFeaturesForOffer(offer),
    })) : [
        {
            id: '1',
            title: 'Mastering Sound: The Pro Series',
            description: 'Our latest audio engineering breakthrough delivers crystal clear highs and deep, immersive lows. Crafted for those who refuse to compromise on quality, the Pro Series represents the pinnacle of wireless technology.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbOI_PCfJlj7oXsGwmsriAuLQalEOKDU0TlFUKsaqLLxt_Te6R3s5bkDxcpUQqKTHRGMy8Bl1RH9yZZKLdwRT4W3BK3OwIH7lmLONWfJiiPWk3ND70zn0i3pK-vNws-WdMVOLm71vy8-seE8N_Nrw7zfMCoXqgwWq-uh4F5cRxOZRObDtxQepEuwtrChFybobsX2EzDV8d0ElvrCkhDFWVHkkm7lwkDFqCTAUg5xcAlcFiBlK_6AvoYDWVpoNbYRVbk0Ue7wCJ8x0',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCbOI_PCfJlj7oXsGwmsriAuLQalEOKDU0TlFUKsaqLLxt_Te6R3s5bkDxcpUQqKTHRGMy8Bl1RH9yZZKLdwRT4W3BK3OwIH7lmLONWfJiiPWk3ND70zn0i3pK-vNws-WdMVOLm71vy8-seE8N_Nrw7zfMCoXqgwWq-uh4F5cRxOZRObDtxQepEuwtrChFybobsX2EzDV8d0ElvrCkhDFWVHkkm7lwkDFqCTAUg5xcAlcFiBlK_6AvoYDWVpoNbYRVbk0Ue7wCJ8x0',
            badge: 'New Arrival',
            category: 'Audio',
            features: ['Active Noise Cancellation (ANC)', '48-Hour Hybrid Battery Life', 'Sustainable Recycled Materials'],
        },
        {
            id: '2',
            title: 'The Future of Wellness',
            description: 'More than just a timepiece. It\'s your personal health companion, designed to keep you at the top of your game with advanced biometrics and seamless integration into your digital life.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChKmHOle0DNxq4r1KNDIZdiNAFPlYl_9kNIEzmGjzGAs7w7DyVkc8KYWKVC_6rRLCAQ-ER-fJfp-im4QDvY3ETv2U_h9t4PCpu4pGVc2blNog3AugfW-a6iCtAF_8iovDoj2zzGa2CTp_IPWqyTXCowxVCNSd3is3piSeod0dSqqZhjpq8G35ayWDGdYYy7Ha7iUCHEelLxnZ3A4wOr-3QO9j2NlaUa0mWfU2X9_zwVPmsXR8lrKHPizE4RQBvsQxoXIFUSllQ7KU',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChKmHOle0DNxq4r1KNDIZdiNAFPlYl_9kNIEzmGjzGAs7w7DyVkc8KYWKVC_6rRLCAQ-ER-fJfp-im4QDvY3ETv2U_h9t4PCpu4pGVc2blNog3AugfW-a6iCtAF_8iovDoj2zzGa2CTp_IPWqyTXCowxVCNSd3is3piSeod0dSqqZhjpq8G35ayWDGdYYy7Ha7iUCHEelLxnZ3A4wOr-3QO9j2NlaUa0mWfU2X9_zwVPmsXR8lrKHPizE4RQBvsQxoXIFUSllQ7KU',
            badge: 'Innovation',
            category: 'Wearables',
            features: ['Next-Gen Heart Rate Sensor', 'Sapphire Crystal Durability', 'Always-On Retina Display'],
        },
        {
            id: '3',
            title: 'Artisanal Craftsmanship',
            description: 'Experience the ritual of perfect coffee. Our pour-over collection combines temperature-stable borosilicate glass with minimalist design for a sensory experience like no other.',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyX7dpl48zbY6N28pwri1breI4CArP2Xy2f-mBO7yKOGQScrBARu66huTAlrdlAQhVNLG-8IWENNdAc4E-kblnEkt8d4_AtI2ojc5TvSrDJDfNWUFfwRWDuIN4RW8mDcNGSZ7H2luZamGbHnuF1kRZ4kadikgV8RIisuEwNPcKsFv0XI31nNy0hwQU_N9Z_dLDLfYKiZHbKGDtVF2P41MTAhyh-VQL3UgIcuzmWKy7NbV0dzjyLiukLOXq_46DCRbIcUN90IFlsH0',
            imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyX7dpl48zbY6N28pwri1breI4CArP2Xy2f-mBO7yKOGQScrBARu66huTAlrdlAQhVNLG-8IWENNdAc4E-kblnEkt8d4_AtI2ojc5TvSrDJDfNWUFfwRWDuIN4RW8mDcNGSZ7H2luZamGbHnuF1kRZ4kadikgV8RIisuEwNPcKsFv0XI31nNy0hwQU_N9Z_dLDLfYKiZHbKGDtVF2P41MTAhyh-VQL3UgIcuzmWKy7NbV0dzjyLiukLOXq_46DCRbIcUN90IFlsH0',
            badge: 'Sustainability',
            category: 'Lifestyle',
            features: ['Hand-Blown Glass', 'Precision Pour Spout', 'Zero-Waste Coffee Filter'],
        },
    ];

    const scrollToIndex = (index: number) => {
        if (scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const itemWidth = container.offsetWidth;
            container.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
            setCurrentIndex(index);
        }
    };

    const handlePrev = () => {
        const newIndex = currentIndex > 0 ? currentIndex - 1 : displayOffers.length - 1;
        scrollToIndex(newIndex);
    };

    const handleNext = () => {
        const newIndex = currentIndex < displayOffers.length - 1 ? currentIndex + 1 : 0;
        scrollToIndex(newIndex);
    };

    return (
        <section className="w-full bg-[#1e293b] dark:bg-[#1e293b] py-20 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col gap-4 mb-12">
                    <h2 className="text-white text-4xl font-black tracking-tight">Featured Highlights</h2>
                    <div className="h-1 w-24 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                </div>
                <div className="relative group">
                    {/* Navigation Buttons */}
                    <div 
                        className="absolute top-1/2 -left-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handlePrev}
                    >
                        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all cursor-pointer">
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                    </div>
                    <div 
                        className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleNext}
                    >
                        <button className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-primary hover:border-primary transition-all cursor-pointer">
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    {/* Carousel */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-8 pb-10"
                        onScroll={(e) => {
                            const container = e.currentTarget;
                            const index = Math.round(container.scrollLeft / container.offsetWidth);
                            setCurrentIndex(index);
                        }}
                    >
                        {displayOffers.map((offer, index) => (
                            <div key={offer.id} className="flex-none w-full snap-center">
                                <div className="grid grid-cols-1 lg:grid-cols-2 bg-white/5 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-sm min-h-[500px]">
                                    {/* Image */}
                                    <div className="relative overflow-hidden group/img">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-110"
                                            style={{ backgroundImage: `url('${offer.image || offer.imageUrl}')` }}
                                        ></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-8 left-8">
                                            <span 
                                                className="px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest"
                                                style={{ backgroundColor: primaryColor }}
                                            >
                                                {offer.badge || offer.category || 'Featured'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-12 flex flex-col justify-center gap-6">
                                        <h3 className="text-white text-4xl font-black leading-tight">{offer.title}</h3>
                                        <p className="text-gray-300 text-lg leading-relaxed">{offer.description}</p>
                                        {offer.features && offer.features.length > 0 && (
                                            <div className="flex flex-col gap-4 mt-4">
                                                {offer.features.map((feature, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-gray-400">
                                                        <span className="material-symbols-outlined" style={{ color: primaryColor }}>check_circle</span>
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

                    {/* Indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                        {displayOffers.map((_, index) => (
                            <div
                                key={index}
                                className={`h-1 rounded-full transition-all cursor-pointer ${
                                    index === currentIndex ? '' : 'bg-white/20'
                                }`}
                                style={{
                                    width: '3rem',
                                    backgroundColor: index === currentIndex ? primaryColor : 'rgba(255, 255, 255, 0.2)',
                                }}
                                onClick={() => scrollToIndex(index)}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
