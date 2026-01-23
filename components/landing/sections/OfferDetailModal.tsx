'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfferDetailModalProps {
    offer: any;
    brandColor: string;
    onClose: () => void;
}

export default function OfferDetailModal({ offer, brandColor, onClose }: OfferDetailModalProps) {
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
                >
                    <div className="grid md:grid-cols-2 gap-8 p-8">
                        {/* Left: Image */}
                        <div className="relative">
                            {offer.image ? (
                                <img
                                    src={offer.image}
                                    alt={offer.title}
                                    className="w-full rounded-xl object-cover"
                                />
                            ) : (
                                <div className="w-full aspect-square bg-slate-800 rounded-xl flex items-center justify-center">
                                    <span className="text-8xl opacity-50">🎁</span>
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="space-y-6">
                            {/* Category & Type */}
                            <div className="flex gap-2">
                                {offer.category && (
                                    <span
                                        className="px-3 py-1 rounded-full text-xs font-bold"
                                        style={{
                                            backgroundColor: `${brandColor}20`,
                                            color: brandColor,
                                        }}
                                    >
                                        {offer.category}
                                    </span>
                                )}
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400">
                                    {offer.offerType}
                                </span>
                            </div>

                            {/* Title */}
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                {offer.title}
                            </h2>

                            {/* Description */}
                            {offer.description && (
                                <p className="text-slate-300 leading-relaxed">
                                    {offer.description}
                                </p>
                            )}

                            {/* Value Information */}
                            {(offer.originalValue || offer.discountValue) && (
                                <div className="p-6 rounded-xl border border-slate-700">
                                    <p className="text-sm text-slate-400 mb-2">Value</p>
                                    {offer.originalValue && (
                                        <p className="text-xl text-slate-500 line-through mb-1">
                                            {offer.originalValue}
                                        </p>
                                    )}
                                    {offer.discountValue && (
                                        <p
                                            className="text-3xl font-black"
                                            style={{ color: brandColor }}
                                        >
                                            {offer.discountValue}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* External Link */}
                            {offer.externalLink && (
                                <a
                                    href={offer.externalLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full px-6 py-4 rounded-xl font-black text-center transition-all transform hover:scale-105"
                                    style={{
                                        background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)`,
                                        color: '#1e293b',
                                    }}
                                >
                                    Learn More →
                                </a>
                            )}

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
