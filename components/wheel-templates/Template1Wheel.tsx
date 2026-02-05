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
}

const Template1Wheel: React.FC<Template1WheelProps> = ({ prizes, controls, segmentAngle }) => {
    // Template 1: Orange (#f48c25) and dark blue shades (#1e293b, #334155, #475569)
    // Colors are hardcoded to match template design - not dependent on brand color
    const TEMPLATE_PRIMARY = '#f48c25';
    const getSegmentColor = (index: number): string => {
        // Alternate between orange and dark blue shades
        const colors = [
            TEMPLATE_PRIMARY,  // 0: orange
            '#1e293b',         // 1: dark blue
            TEMPLATE_PRIMARY,  // 2: orange
            '#334155',         // 3: medium dark blue
            TEMPLATE_PRIMARY,  // 4: orange
            '#1e293b',         // 5: dark blue
            TEMPLATE_PRIMARY,  // 6: orange
            '#475569',         // 7: lighter dark blue
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

                    // Path for circular segment
                    const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                    const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                    const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                    const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);

                    const largeArcFlag = segmentAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    // For Template1, always use the template-specific color scheme
                    // Ignore prize.colorCode to ensure correct orange/dark blue alternation
                    const fillColor = getSegmentColor(index);
                    
                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={fillColor}
                                stroke="#0f172a"
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

        </motion.div>
    );
};

export default Template1Wheel;
