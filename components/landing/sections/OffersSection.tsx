'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import OfferDetailModal from './OfferDetailModal';

interface OffersSectionProps {
    section: any;
    offers: any[];
    brandColor: string;
}

export default function OffersSection({ section, offers, brandColor }: OffersSectionProps) {
    const [selectedOffer, setSelectedOffer] = useState<any>(null);
    const content = section.content || {};
    const title = content.title || 'What You Can Win';
    const description = content.description || 'Check out these amazing prizes!';

    if (!offers || offers.length === 0) {
        return null; // Don't render if no offers
    }

    return (
        <section className="py-20 px-4 bg-slate-900/50">
            <div className="container mx-auto max-w-7xl">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12"
                >
                    <h2 
                        className="text-4xl md:text-5xl font-black mb-4"
                        style={{ color: brandColor }}
                    >
                        {title}
                    </h2>
                    <p className="text-xl text-slate-400">{description}</p>
                </motion.div>

                {/* Offers Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {offers.map((offer, index) => (
                        <motion.div
                            key={offer.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            onClick={() => setSelectedOffer(offer)}
                            className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-all cursor-pointer group hover:scale-105"
                        >
                            {/* Offer Image */}
                            <div className="aspect-video bg-slate-700 relative overflow-hidden">
                                {offer.image ? (
                                    <img
                                        src={offer.image}
                                        alt={offer.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <span className="text-6xl opacity-50">🎁</span>
                                    </div>
                                )}
                                {/* Overlay gradient */}
                                <div 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity"
                                    style={{ background: `linear-gradient(to top, ${brandColor}, transparent)` }}
                                />
                            </div>

                            {/* Offer Info */}
                            <div className="p-6">
                                {/* Category Badge */}
                                {offer.category && (
                                    <span 
                                        className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
                                        style={{ 
                                            backgroundColor: `${brandColor}20`,
                                            color: brandColor 
                                        }}
                                    >
                                        {offer.category}
                                    </span>
                                )}

                                {/* Title */}
                                <h3 className="text-xl font-black text-white mb-2 line-clamp-2">
                                    {offer.title}
                                </h3>

                                {/* Short Description */}
                                {offer.shortDescription && (
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {offer.shortDescription}
                                    </p>
                                )}

                                {/* Value Info */}
                                {(offer.originalValue || offer.discountValue) && (
                                    <div className="mb-4">
                                        {offer.originalValue && (
                                            <p className="text-sm text-slate-500 line-through">
                                                {offer.originalValue}
                                            </p>
                                        )}
                                        {offer.discountValue && (
                                            <p 
                                                className="text-lg font-black"
                                                style={{ color: brandColor }}
                                            >
                                                {offer.discountValue}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* View Details Button */}
                                <button
                                    className="w-full px-4 py-2 rounded-lg font-bold text-sm transition-all"
                                    style={{
                                        backgroundColor: `${brandColor}20`,
                                        color: brandColor,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = brandColor;
                                        e.currentTarget.style.color = '#1e293b';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = `${brandColor}20`;
                                        e.currentTarget.style.color = brandColor;
                                    }}
                                >
                                    View Details →
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Offer Detail Modal */}
            {selectedOffer && (
                <OfferDetailModal
                    offer={selectedOffer}
                    brandColor={brandColor}
                    onClose={() => setSelectedOffer(null)}
                />
            )}
        </section>
    );
}
