'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface NeonWheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    config?: {
        primaryColor?: string;
        secondaryColor?: string;
        glow?: boolean;
    };
}

const NeonWheel: React.FC<NeonWheelProps> = ({ prizes, controls, segmentAngle, config }) => {
    const primaryColor = config?.primaryColor || '#00ff88';
    const secondaryColor = config?.secondaryColor || '#ff0080';
    const useGlow = config?.glow !== false;

    return (
        <motion.div
            animate={controls}
            className="w-full h-full rounded-full border-2 border-cyan-400/50 overflow-hidden shadow-[0_0_40px_rgba(34,211,238,0.4)] relative"
            style={{ transformOrigin: 'center center' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <defs>
                    {useGlow && (
                        <>
                            <filter id="neonGlow">
                                <feGaussianBlur stdDeviation="1" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
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

                    const fillColor = index % 2 === 0 ? primaryColor : secondaryColor;

                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={prize.colorCode || fillColor}
                                stroke="#000000"
                                strokeWidth="1"
                                filter={useGlow ? 'url(#neonGlow)' : undefined}
                                opacity="0.9"
                            />
                            <text
                                x="78"
                                y="50"
                                fill="#ffffff"
                                fontSize="5"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                                className="pointer-events-none"
                                style={{
                                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
                                }}
                            >
                                {prize.name}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Neon Center Circle */}
            <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-4 border-black z-10 flex items-center justify-center shadow-2xl"
                style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: useGlow
                        ? `0 0 20px ${primaryColor}, inset 0 0 10px rgba(0,0,0,0.5)`
                        : 'none'
                }}
            >
                <div className="text-white font-black text-[12px] text-center leading-none" style={{ textShadow: '1px 1px 3px rgba(0,0,0,1)' }}>
                    WIN
                </div>
            </div>

            {/* Neon Glow Effects */}
            {useGlow && (
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <div
                        className="absolute top-1/4 left-0 w-40 h-80 blur-3xl rounded-full"
                        style={{ backgroundColor: primaryColor, opacity: 0.3 }}
                    ></div>
                    <div
                        className="absolute bottom-1/4 right-0 w-40 h-80 blur-3xl rounded-full"
                        style={{ backgroundColor: secondaryColor, opacity: 0.3 }}
                    ></div>
                </div>
            )}
        </motion.div>
    );
};

export default NeonWheel;
