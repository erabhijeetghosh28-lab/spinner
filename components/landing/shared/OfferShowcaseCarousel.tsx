'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface Offer {
    id: string;
    title: string;
    description: string;
    image: string;
    badge?: string;
    category?: string;
    features?: string[];
    isActive: boolean;
}

interface OfferShowcaseCarouselProps {
    offers: Offer[];
    variant?: 'light' | 'dark' | 'cyan';
}

export default function OfferShowcaseCarousel({ 
    offers,
    variant = 'dark'
}: OfferShowcaseCarouselProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Theme-specific styles
    const themes = {
        light: {
            sectionBg: 'bg-[#1e293b]',
            headingColor: 'text-white',
            underlineColor: 'bg-[#f48c25]',
            cardBg: 'bg-[#0f1822]',
            textColor: 'text-white',
            textSecondary: 'text-gray-400',
            badgeBg: 'bg-[#f48c25]',
            badgeText: 'text-[#181411]',
            checkmarkColor: 'text-[#f48c25]',
            navBtn: 'bg-white/10 hover:bg-[#f48c25] border-white/20'
        },
        dark: {
            sectionBg: 'bg-[#121212]/40',
            headingColor: 'text-white',
            underlineColor: 'bg-[#f48c25]',
            cardBg: 'glass-panel',
            textColor: 'text-white',
            textSecondary: 'text-gray-400',
            badgeBg: 'bg-[#f48c25]',
            badgeText: 'text-[#181411]',
            checkmarkColor: 'text-[#f48c25]',
            navBtn: 'bg-[#161e2e]/80 hover:bg-[#f48c25] border-[#f48c25]/30'
        },
        cyan: {
            sectionBg: 'bg-[#121212]/40',
            headingColor: 'text-white',
            underlineColor: 'bg-gradient-to-r from-[#00f2ff] to-transparent',
            cardBg: 'glass-panel',
            textColor: 'text-white',
            textSecondary: 'text-gray-400',
            badgeBg: 'bg-[#00f2ff]',
            badgeText: 'text-[#0a0f1d]',
            checkmarkColor: 'text-[#00f2ff]',
            navBtn: 'bg-[#161e2e]/80 hover:bg-[#00f2ff] border-[#00f2ff]/30 hover:text-[#0a0f1d]'
        }
    };

    const theme = themes[variant];

    const activeOffers = offers.filter(o => o.isActive);
    const displayOffers = activeOffers.length > 0 ? activeOffers : [
        {
            id: '1',
            title: 'Mastering Sound: The Pro Series',
            description: 'Our latest audio engineering breakthrough delivers crystal clear highs and deep, immersive lows. Crafted for those who refuse to compromise on quality, the Pro Series represents the pinnacle of wireless technology.',
            image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
            badge: 'New Arrival',
            category: 'Audio',
            features: [
                'Active Noise Cancellation (ANC)',
                '48-Hour Hybrid Battery Life',
                'Sustainable Recycled Materials'
            ],
            isActive: true
        }
    ];

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % displayOffers.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + displayOffers.length) % displayOffers.length);
    };

    return (
        <section className={`w-full ${theme.sectionBg} py-20 overflow-hidden ${variant !== 'light' ? 'border-y border-white/5' : ''}`}>
            <div className="max-w-[1200px] mx-auto px-6">
                {/* Header */}
                <div className="flex flex-col gap-4 mb-12">
                    <h2 className={`${theme.headingColor} text-4xl font-black tracking-tight`}>
                        Featured <span className={variant === 'cyan' ? 'text-[#00f2ff]' : ''}>Highlights</span>
                    </h2>
                    <div className={`h-1 w-24 ${theme.underlineColor} rounded-full`}></div>
                </div>

                {/* Carousel */}
                <div className="relative group">
                    {/* Navigation Arrows */}
                    {displayOffers.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                className={`absolute top-1/2 -left-6 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full ${theme.navBtn} backdrop-blur-md border flex items-center justify-center transition-all shadow-lg`}
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>
                            <button
                                onClick={nextSlide}
                                className={`absolute top-1/2 -right-6 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity w-12 h-12 rounded-full ${theme.navBtn} backdrop-blur-md border flex items-center justify-center transition-all shadow-lg`}
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </>
                    )}

                    {/* Slides */}
                    <div className="relative min-h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentSlide}
                                initial={{ opacity: 0, x: 100 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -100 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className={`grid grid-cols-1 lg:grid-cols-2 ${theme.cardBg} rounded-3xl overflow-hidden border border-white/5 min-h-[500px]`}>
                                    {/* Image */}
                                    <div className="relative overflow-hidden group/img">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover/img:scale-105"
                                            style={{ backgroundImage: `url('${displayOffers[currentSlide].image}')` }}
                                        ></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1d]/80 via-transparent to-transparent"></div>
                                        
                                        {/* Badge */}
                                        {displayOffers[currentSlide].badge && (
                                            <div className="absolute bottom-8 left-8">
                                                <span className={`${theme.badgeBg} ${theme.badgeText} px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest`}>
                                                    {displayOffers[currentSlide].badge}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-12 flex flex-col justify-center gap-6">
                                        <h3 className={`${theme.textColor} text-4xl font-black leading-tight`}>
                                            {displayOffers[currentSlide].title}
                                        </h3>
                                        <p className={`${theme.textSecondary} text-lg leading-relaxed`}>
                                            {displayOffers[currentSlide].description}
                                        </p>

                                        {/* Features */}
                                        {displayOffers[currentSlide].features && displayOffers[currentSlide].features!.length > 0 && (
                                            <div className="flex flex-col gap-4 mt-4">
                                                {displayOffers[currentSlide].features!.map((feature, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 text-gray-300">
                                                        <span className={`material-symbols-outlined ${theme.checkmarkColor}`}>verified</span>
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Slide Indicators */}
                    {displayOffers.length > 1 && (
                        <div className="flex justify-center gap-3 mt-6">
                            {displayOffers.map((_, idx) => (
                                <div
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-1 rounded-full cursor-pointer transition-all ${
                                        idx === currentSlide
                                            ? `w-12 ${variant === 'cyan' ? 'bg-[#00f2ff] shadow-[0_0_8px_rgba(0,242,255,0.6)]' : 'bg-[#f48c25]'}`
                                            : 'w-12 bg-white/10 hover:bg-white/20'
                                    }`}
                                ></div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
