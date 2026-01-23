'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface Template3WheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    primaryColor?: string;
}

const Template3Wheel: React.FC<Template3WheelProps> = ({ prizes, controls, segmentAngle }) => {
    // Template 3: Gold (#D4AF37) and White (#FFFFFF)
    // Colors are hardcoded to match template design - not dependent on brand color
    const TEMPLATE_PRIMARY = '#D4AF37';
    const getSegmentColor = (index: number): string => {
        const colors = [
            TEMPLATE_PRIMARY,  // 0: gold
            '#FFFFFF',         // 1: white
            TEMPLATE_PRIMARY,  // 2: gold
            '#FFFFFF',         // 3: white
            TEMPLATE_PRIMARY,  // 4: gold
            '#FFFFFF',         // 5: white
            TEMPLATE_PRIMARY,  // 6: gold
            '#FFFFFF',         // 7: white
        ];
        return colors[index % colors.length];
    };

    return (
        <motion.div
            animate={controls}
            className="w-full h-full rounded-full relative z-0"
            style={{ transformOrigin: 'center center', backgroundColor: 'transparent' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90" style={{ position: 'absolute', inset: 0 }}>
                {prizes.map((prize, index) => {
                    const startAngle = index * segmentAngle;
                    const endAngle = startAngle + segmentAngle;
                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    const fillColor = getSegmentColor(index);
                    const isGold = fillColor === TEMPLATE_PRIMARY;
                    
                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={fillColor}
                                stroke={isGold ? '#C5A028' : '#E5E5E5'}
                                strokeWidth="0.3"
                            />
                            <text
                                x="78"
                                y="50"
                                fill={isGold ? 'white' : '#2C241D'}
                                fontSize="4.5"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                                className="pointer-events-none"
                                style={{ textShadow: isGold ? '2px 2px 4px rgba(0,0,0,0.8)' : '1px 1px 2px rgba(0,0,0,0.2)' }}
                            >
                                {prize.name.length > 15 ? prize.name.substring(0, 12) + '...' : prize.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white dark:bg-[#1A1612] w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl flex items-center justify-center border-4 border-[#D4AF37] pointer-events-none">
                <span className="text-[#D4AF37] font-serif font-bold text-base md:text-lg tracking-widest">SPIN</span>
            </div>
        </motion.div>
    );
};

export default Template3Wheel;
