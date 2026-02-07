'use client';

import { motion } from 'framer-motion';
import React from 'react';

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
            <svg viewBox="0 0 100 100" className="w-full h-full">
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
                    const anglePerSlice = 360 / prizes.length;
                    const midAngle = (index * anglePerSlice) + (anglePerSlice / 2) - 90;
                    
                    const textRadius = 32;
                    const x = 50 + textRadius * Math.cos(midAngle * Math.PI / 180);
                    const y = 50 + textRadius * Math.sin(midAngle * Math.PI / 180);
                    
                    // Smart flipping: normalize angle and flip if on left side
                    let normalizedAngle = ((midAngle % 360) + 360) % 360;
                    let textRotation = midAngle;
                    if (normalizedAngle > 90 && normalizedAngle < 270) {
                        textRotation += 180;
                    }
                    const fontSize = Math.max(2.8, Math.min(5.5, 20 / prizes.length + 1.5));

                    const startAngle = index * anglePerSlice - 90;
                    const endAngle = startAngle + anglePerSlice;

                    const x1 = 50 + 50 * Math.cos(startAngle * Math.PI / 180);
                    const y1 = 50 + 50 * Math.sin(startAngle * Math.PI / 180);
                    const x2 = 50 + 50 * Math.cos(endAngle * Math.PI / 180);
                    const y2 = 50 + 50 * Math.sin(endAngle * Math.PI / 180);

                    const largeArcFlag = anglePerSlice > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    const fillColor = useGradient
                        ? (index % 2 === 0 ? 'url(#modernGrad1)' : 'url(#modernGrad2)')
                        : (index % 2 === 0 ? primaryColor : secondaryColor);

                    const maxLen = prizes.length <= 4 ? 18 : (prizes.length <= 8 ? 12 : 8);
                    const displayName = prize.name.length > maxLen ? prize.name.substring(0, maxLen - 2) + '..' : prize.name;

                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={prize.colorCode || fillColor}
                                stroke="#1e293b"
                                strokeWidth="0.8"
                            />
                            <text
                                x={x}
                                y={y}
                                fill="white"
                                fontSize={fontSize}
                                fontWeight="900"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${textRotation}, ${x}, ${y})`}
                                className="pointer-events-none select-none"
                                style={{ 
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                                    letterSpacing: prizes.length > 8 ? '-0.05em' : 'normal'
                                }}
                            >
                                {displayName}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-slate-900 z-10 flex items-center justify-center shadow-2xl">
                <span className="text-white font-extrabold text-xs">SPIN</span>
            </div>
        </motion.div>
    );
};

export default ModernWheel;
