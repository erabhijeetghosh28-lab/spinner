'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface Template1WheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
    primaryColor?: string;
    onTransitionEnd?: () => void;
}

const Template1Wheel_V2: React.FC<Template1WheelProps> = ({ prizes, controls, segmentAngle }) => {
    // Template 1: Orange (#f48c25) and dark blue shades (#1e293b, #334155, #475569)
    const TEMPLATE_PRIMARY = '#f48c25';
    const getSegmentColor = (index: number): string => {
        const darkColors = ['#1e293b', '#334155', '#475569'];
        if (index % 2 === 0) return TEMPLATE_PRIMARY;
        return darkColors[(index >> 1) % darkColors.length];
    };

    const prizeCount = prizes.length;
    
    // Dynamic configurations
    const getTextRadius = () => {
        if (prizeCount <= 4) return 28; // 50 + 28 = 78
        if (prizeCount <= 6) return 30;
        if (prizeCount <= 8) return 32;
        if (prizeCount <= 12) return 34;
        return 36;
    };
    
    const getFontSize = () => {
        if (prizeCount <= 4) return 4.5;
        if (prizeCount <= 6) return 4.0;
        if (prizeCount <= 8) return 3.5;
        if (prizeCount <= 12) return 3.0;
        if (prizeCount <= 16) return 2.6;
        return 2.2;
    };
    
    const getMaxTextLength = () => {
        if (prizeCount <= 4) return 20;
        if (prizeCount <= 6) return 15;
        if (prizeCount <= 8) return 12;
        return 8;
    };
    
    const getStrokeWidth = () => {
        if (prizeCount <= 8) return 0.3;
        if (prizeCount <= 12) return 0.2;
        return 0.15;
    };
    
    const getLetterSpacing = () => {
        if (prizeCount <= 6) return 'normal';
        return '-0.03em';
    };

    const textRadius = getTextRadius();
    const fontSize = getFontSize();
    const strokeWidth = getStrokeWidth();
    const maxTextLength = getMaxTextLength();
    const letterSpacing = getLetterSpacing();

    return (
        <motion.div
            animate={controls}
            className="w-full h-full rounded-full relative z-0"
            style={{ transformOrigin: 'center center', backgroundColor: 'transparent' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90" style={{ position: 'absolute', inset: 0 }}>
                {prizes.map((prize, index) => {
                    const anglePerSlice = 360 / prizeCount;
                    
                    // Simple Slice Geometry
                    // Start = index * angle
                    // End = start + angle
                    const startAngle = index * anglePerSlice;
                    const endAngle = startAngle + anglePerSlice;
                    
                    // Coordinates for Slice Path
                    const x1 = 50 + 50 * Math.cos(startAngle * Math.PI / 180);
                    const y1 = 50 + 50 * Math.sin(startAngle * Math.PI / 180);
                    const x2 = 50 + 50 * Math.cos(endAngle * Math.PI / 180);
                    const y2 = 50 + 50 * Math.sin(endAngle * Math.PI / 180);

                    const largeArcFlag = anglePerSlice > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
                    
                    // Text Logic
                    const midAngle = startAngle + (anglePerSlice / 2);
                    const textX = 50 + textRadius;
                    const textY = 50;

                    const fillColor = getSegmentColor(index);
                    
                    // Truncate text if needed
                    const displayName = prize.name.length > maxTextLength 
                        ? prize.name.substring(0, maxTextLength - 2) + '..' 
                        : prize.name;

                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={fillColor}
                                stroke="#0f172a"
                                strokeWidth={strokeWidth}
                            />
                            <text
                                x={textX}
                                y={textY}
                                fill="white"
                                fontSize={fontSize}
                                fontWeight="900"
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${midAngle}, 50, 50)`}
                                className="pointer-events-none"
                                style={{ 
                                    textShadow: 'rgba(0, 0, 0, 0.8) 2px 2px 4px',
                                    letterSpacing: letterSpacing
                                }}
                            >
                                {displayName}
                            </text>
                        </g>
                    );
                })}
            </svg>
            
            <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-[#1e293b] pointer-events-none"
                style={{
                    width: prizeCount <= 8 ? '7rem' : '5rem',
                    height: prizeCount <= 8 ? '7rem' : '5rem',
                }}
            >
                <span className="font-black text-sm md:text-base tracking-tighter" style={{ color: TEMPLATE_PRIMARY }}>SPIN!</span>
            </div>
        </motion.div>
    );
};

export default Template1Wheel_V2;
