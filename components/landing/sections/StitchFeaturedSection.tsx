'use client';

import { useRef } from 'react';

interface StitchFeaturedSectionProps {
    offers: any[];
    brandColor?: string;
}

export default function StitchFeaturedSection({ offers, brandColor = '#f48c25' }: StitchFeaturedSectionProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
        }
    };

    if (!offers || offers.length === 0) return null;

    return (
        <section className="w-full bg-[#1e293b] dark:bg-[#1a120b] py-20 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-6">
                <div className="flex flex-col gap-4 mb-12">
                    <h2 className="text-white text-2xl md:text-4xl font-black tracking-tight">Featured Highlights</h2>
                    <div className="h-1 w-24 rounded-full" style={{ backgroundColor: brandColor }}></div>
                </div>

                <div className="relative group">
                    {/* Navigation Buttons */}
                    <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                        <button 
                            onClick={scrollLeft}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                    </div>
                    <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                        <button 
                            onClick={scrollRight}
                            className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all"
                        >
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>

                    {/* Horizontal Scroll Container */}
                    <div 
                        ref={scrollContainerRef}
                        className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-8 pb-10"
                        style={{ scrollBehavior: 'smooth' }}
                    >
                        {offers.map((offer, index) => (
                            <div key={offer.id || index} className="flex-none w-full lg:w-[90%] snap-center">
                                <div className="grid grid-cols-1 lg:grid-cols-2 bg-white/5 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-sm min-h-[500px]">
                                    {/* Image Side */}
                                    <div className="relative overflow-hidden group/img min-h-[300px] lg:min-h-full">
                                        <div 
                                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover/img:scale-110"
                                            style={{ backgroundImage: `url('${offer.image || offer.imageUrl || 'https://images.unsplash.com/photo-1550009158-b0126023d565?q=80&w=2670&auto=format&fit=crop'}')` }}
                                        ></div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-8 left-8">
                                            <span className="px-3 py-1 rounded text-[10px] font-bold text-white uppercase tracking-widest" style={{ backgroundColor: brandColor }}>
                                                {offer.category || "Exclusive"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Content Side */}
                                    <div className="p-6 lg:p-12 flex flex-col justify-center gap-6">
                                        <h3 className="text-white text-2xl lg:text-4xl font-black leading-tight">{offer.name || offer.title}</h3>
                                        {offer.description && (
                                            <p className="text-gray-300 text-lg leading-relaxed line-clamp-3">
                                                {offer.description}
                                            </p>
                                        )}
                                        
                                        {offer.features && offer.features.length > 0 && (
                                            <div className="flex flex-col gap-4 mt-4">
                                                {offer.features.map((feature: string, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-3 text-gray-400">
                                                        <span className="material-symbols-outlined" style={{ color: brandColor }}>check_circle</span>
                                                        <span>{feature}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        
                                        {offer.value && (
                                            <div className="flex items-center gap-3 text-gray-400">
                                                <span className="material-symbols-outlined" style={{ color: brandColor }}>check_circle</span>
                                                <span>Value: {offer.value}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Scroll Indicators */}
                    <div className="flex justify-center gap-2 mt-4">
                        {offers.map((_, i) => (
                            <div 
                                key={i} 
                                className={`w-12 h-1 rounded-full ${i === 0 ? '' : 'bg-white/20'}`}
                                style={i === 0 ? { backgroundColor: brandColor } : {}}
                            ></div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
