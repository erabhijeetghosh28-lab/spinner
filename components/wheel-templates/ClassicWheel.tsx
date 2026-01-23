'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface ClassicWheelProps {
    prizes: Prize[];
    controls: any;
    segmentAngle: number;
}

const ClassicWheel: React.FC<ClassicWheelProps> = ({ prizes, controls, segmentAngle }) => {
    return (
        <motion.div
            animate={controls}
            className="w-full h-full rounded-full border-8 border-amber-500 overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.3)] relative"
            style={{ transformOrigin: 'center center' }}
        >
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
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

                    // Classic style: alternating blue shades
                    const fillColor = index % 2 === 0 ? '#1E3A8A' : '#1e40af';

                    return (
                        <g key={prize.id}>
                            <path
                                d={pathData}
                                fill={prize.colorCode || fillColor}
                                stroke="#0f172a"
                                strokeWidth="0.5"
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

            {/* Center Circle with Logo placeholder */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-amber-500 border-4 border-slate-900 z-10 flex items-center justify-center shadow-lg">
                <div className="text-slate-900 font-extrabold text-[8px] text-center leading-none">
                    YOUR<br />LOGO
                </div>
            </div>

            {/* Light Spots */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-1/4 left-0 w-24 h-48 bg-white/10 blur-2xl rotate-45 rounded-full"></div>
                <div className="absolute top-1/4 right-0 w-24 h-48 bg-white/10 blur-2xl -rotate-45 rounded-full"></div>
            </div>
        </motion.div>
    );
};

export default ClassicWheel;
