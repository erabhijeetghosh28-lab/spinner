'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface Template5WheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    primaryColor?: string;
}

const Template5Wheel: React.FC<Template5WheelProps> = ({ prizes, controls, segmentAngle }) => {
    // Template 5: Ferrari Red (#FF0800) and Black shades (#000000, #1a1a1a)
    // Colors are hardcoded to match template design - not dependent on brand color
    const TEMPLATE_PRIMARY = '#FF0800';
    const getSegmentColor = (index: number): string => {
        const colors = [
            TEMPLATE_PRIMARY,  // 0: red
            '#000000',         // 1: black
            TEMPLATE_PRIMARY,  // 2: red
            '#1a1a1a',         // 3: dark gray
            TEMPLATE_PRIMARY,  // 4: red
            '#000000',         // 5: black
            TEMPLATE_PRIMARY,  // 6: red
            '#1a1a1a',         // 7: dark gray
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
                                stroke="#000000"
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white dark:bg-black w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl flex items-center justify-center border-4 border-black dark:border-[#FF0800] pointer-events-none">
                <span className="text-[#FF0800] font-black text-base md:text-xl tracking-tighter">SPIN</span>
            </div>
        </motion.div>
    );
};

export default Template5Wheel;
