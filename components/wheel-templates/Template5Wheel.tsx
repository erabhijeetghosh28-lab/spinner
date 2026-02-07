'use client';

import { motion } from 'framer-motion';
import React from 'react';

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
    const TEMPLATE_PRIMARY = '#FF0800';
    const getSegmentColor = (index: number): string => {
        const altColors = ['#000000', '#1a1a1a'];
        if (index % 2 === 0) return TEMPLATE_PRIMARY;
        return altColors[(index >> 1) % altColors.length];
    };

    return (
        <motion.div
            animate={controls}
            className="w-full h-full rounded-full relative z-0"
            style={{ transformOrigin: 'center center', backgroundColor: 'transparent' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ position: 'absolute', inset: 0 }}>
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
                    const fillColor = getSegmentColor(index);
                    
                    const maxLen = prizes.length <= 4 ? 18 : (prizes.length <= 8 ? 12 : 8);
                    const displayName = prize.name.length > maxLen ? prize.name.substring(0, maxLen - 2) + '..' : prize.name;

                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={fillColor}
                                stroke="#000000"
                                strokeWidth="0.3"
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
                                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                                    letterSpacing: prizes.length > 8 ? '-0.05em' : 'normal'
                                }}
                            >
                                {displayName}
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
