'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface Template2WheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    primaryColor?: string;
}

const Template2Wheel: React.FC<Template2WheelProps> = ({ prizes, controls, segmentAngle }) => {
    // Template 2: Electric Cyan (#00f2ff) and Navy shades (#0a0f1d, #161e2e)
    // Colors are hardcoded to match template design - not dependent on brand color
    const TEMPLATE_PRIMARY = '#00f2ff';
    const getSegmentColor = (index: number): string => {
        const colors = [
            TEMPLATE_PRIMARY,  // 0: cyan
            '#0a0f1d',         // 1: navy-dark
            TEMPLATE_PRIMARY,  // 2: cyan
            '#161e2e',         // 3: navy-muted
            TEMPLATE_PRIMARY,  // 4: cyan
            '#0a0f1d',         // 5: navy-dark
            TEMPLATE_PRIMARY,  // 6: cyan
            '#161e2e',         // 7: navy-muted
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
                    
                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={fillColor}
                                stroke="#0a0f1d"
                                strokeWidth="0.3"
                            />
                            <text
                                x="78"
                                y="50"
                                fill="white"
                                fontSize="4.5"
                                fontWeight="900"
                                textAnchor="middle"
                                transform={`rotate(${startAngle + segmentAngle / 2}, 50, 50)`}
                                className="pointer-events-none"
                                style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}
                            >
                                {prize.name.length > 15 ? prize.name.substring(0, 12) + '...' : prize.name}
                            </text>
                        </g>
                    );
                })}
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#161e2e] w-16 h-16 md:w-20 md:h-20 rounded-full shadow-2xl flex items-center justify-center border-4 border-[#00f2ff] pointer-events-none">
                <span className="text-[#00f2ff] font-black text-sm md:text-base tracking-tighter">SPIN</span>
            </div>
        </motion.div>
    );
};

export default Template2Wheel;
