'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface ModernWheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    config?: {
        primaryColor?: string;
        secondaryColor?: string;
        gradient?: boolean;
    };
}

const ModernWheel: React.FC<ModernWheelProps> = ({ prizes, controls, segmentAngle, config }) => {
    const primaryColor = config?.primaryColor || '#6366f1';
    const secondaryColor = config?.secondaryColor || '#8b5cf6';
    const useGradient = config?.gradient !== false;

    return (
        <motion.div
            animate={controls}
            className="w-full h-full rounded-full border-8 border-indigo-500 overflow-hidden shadow-[0_0_60px_rgba(99,102,241,0.4)] relative"
            style={{ transformOrigin: 'center center' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <defs>
                    {useGradient && (
                        <>
                            <linearGradient id="modernGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={primaryColor} stopOpacity="1" />
                                <stop offset="100%" stopColor={secondaryColor} stopOpacity="1" />
                            </linearGradient>
                            <linearGradient id="modernGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={secondaryColor} stopOpacity="1" />
                                <stop offset="100%" stopColor={primaryColor} stopOpacity="1" />
                            </linearGradient>
                        </>
                    )}
                </defs>
                {prizes.map((prize, index) => {
                    const startAngle = index * segmentAngle;
                    const endAngle = startAngle + segmentAngle;

                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    const fillColor = useGradient
                        ? (index % 2 === 0 ? 'url(#modernGrad1)' : 'url(#modernGrad2)')
                        : (index % 2 === 0 ? primaryColor : secondaryColor);

                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={prize.colorCode || fillColor}
                                stroke="#1e293b"
                                strokeWidth="0.8"
                            />
                            <text
                                x="78"
                                y="50"
                                fill="white"
                                fontSize="5"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                                className="pointer-events-none"
                                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                            >
                                {prize.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Modern Center Circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-slate-900 z-10 flex items-center justify-center shadow-2xl">
                <div className="text-white font-extrabold text-[10px] text-center leading-none">
                    SPIN
                </div>
            </div>

            {/* Modern Glow Effects */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-0 w-32 h-64 bg-indigo-500/20 blur-3xl rotate-45 rounded-full"></div>
                <div className="absolute bottom-1/4 right-0 w-32 h-64 bg-purple-500/20 blur-3xl -rotate-45 rounded-full"></div>
            </div>
        </motion.div>
    );
};

export default ModernWheel;
