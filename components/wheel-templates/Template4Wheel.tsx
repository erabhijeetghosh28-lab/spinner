'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface Template4WheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    primaryColor?: string;
}

const Template4Wheel: React.FC<Template4WheelProps> = ({ prizes, controls, segmentAngle }) => {
    // Template 4: Forest Green (#2D5A47), Sage (#8DAA9D), Terracotta (#CD7F63), Beige (#E3D5CA)
    // Colors are hardcoded to match template design - not dependent on brand color
    const TEMPLATE_PRIMARY = '#2D5A47';
    const getSegmentColor = (index: number): string => {
        const colors = [
            TEMPLATE_PRIMARY,  // 0: forest green
            '#8DAA9D',         // 1: sage
            '#CD7F63',         // 2: terracotta
            '#E3D5CA',         // 3: beige
            TEMPLATE_PRIMARY,  // 4: forest green
            '#8DAA9D',         // 5: sage
            '#CD7F63',         // 6: terracotta
            '#E3D5CA',         // 7: beige
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
                    const isDark = fillColor === TEMPLATE_PRIMARY || fillColor === '#8DAA9D';
                    
                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={fillColor}
                                stroke={isDark ? '#1A2421' : '#D4C4B8'}
                                strokeWidth="0.3"
                            />
                            <text
                                x="78"
                                y="50"
                                fill={isDark ? 'white' : '#2D3436'}
                                fontSize="4.5"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                                className="pointer-events-none"
                                style={{ textShadow: isDark ? '2px 2px 4px rgba(0,0,0,0.8)' : '1px 1px 2px rgba(0,0,0,0.2)' }}
                            >
                                {prize.name.length > 15 ? prize.name.substring(0, 12) + '...' : prize.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white dark:bg-[#1A2421] w-16 h-16 md:w-20 md:h-20 rounded-full shadow-xl flex items-center justify-center border-4 border-[#2D5A47] pointer-events-none">
                <span className="text-[#2D5A47] font-black text-sm md:text-base tracking-tighter">SPIN</span>
            </div>
        </motion.div>
    );
};

export default Template4Wheel;
