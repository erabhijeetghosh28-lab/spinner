'use client';

import { motion } from 'framer-motion';

interface SpinWheelProps {
    variant?: 'light' | 'dark' | 'cyan' | 'custom';
    onSpin?: () => void;
    className?: string;
    prizes?: Array<{
        id: string;
        name: string;
        colorCode?: string;
    }>;
    customColors?: {
        primary: string;
        secondary: string;
        border: string;
        centerBg: string;
        centerText: string;
    };
    logoUrl?: string | null;
}

export default function SpinWheel({ 
    variant = 'light', 
    onSpin,
    className = '',
    prizes = [],
    customColors,
    logoUrl
}: SpinWheelProps) {
    // Color configurations for each variant
    const getColors = () => {
        const variants = {
            light: {
                primary: '#f48c25',
                secondary: '#1e293b',
                border: '#1e293b',
                centerBg: 'white',
                centerText: '#f48c25',
                alt: ['#334155', '#475569']
            },
            dark: {
                primary: '#f48c25',
                secondary: '#0a0f1d',
                border: '#334155',
                centerBg: '#1e293b',
                centerText: '#f48c25',
                alt: ['#161e2e', '#1c2636']
            },
            cyan: {
                primary: '#00f2ff',
                secondary: '#0a0f1d',
                border: '#161e2e',
                centerBg: '#161e2e',
                centerText: '#00f2ff',
                alt: ['#161e2e', '#1c2636']
            },
            custom: {
                primary: customColors?.primary || '#f48c25',
                secondary: customColors?.secondary || '#1e293b',
                border: customColors?.border || '#1e293b',
                centerBg: customColors?.centerBg || '#ffffff',
                centerText: customColors?.centerText || '#f48c25',
                alt: [customColors?.secondary || '#1e293b']
            }
        };

        const v = variants[variant as keyof typeof variants] || variants.light;
        
        // Generate dynamic conic gradient
        const total = prizes.length || 8;
        const step = 360 / total;
        const parts: string[] = [];
        
        for (let i = 0; i < total; i++) {
            let color = i % 2 === 0 ? v.primary : v.secondary;
            if (i % 2 !== 0 && v.alt.length > 0) {
                color = v.alt[(i >> 1) % v.alt.length];
            }
            parts.push(`${color} ${i * step}deg ${(i + 1) * step}deg`);
        }

        return {
            ...v,
            gradient: `conic-gradient(${parts.join(', ')})`
        };
    };

    const colors = getColors();

    return (
        <div className={`flex flex-col items-center justify-center relative ${className}`}>
            {/* Spin Wheel */}
            <div 
                className="relative w-72 h-72 md:w-[400px] md:h-[400px] rounded-full border-8 shadow-2xl flex items-center justify-center overflow-hidden group"
                style={{
                    borderColor: colors.border,
                    background: colors.gradient
                }}
            >
                {/* Prize labels on segments */}
                {prizes.length > 0 && prizes.map((prize, index) => {
                    const totalPrizes = prizes.length;
                    const stepAngle = 360 / totalPrizes;
                    const midAngle = (stepAngle * index) + (stepAngle / 2);
                    
                    // Radius adjusted to stay well within the 200px wheel radius (400px container)
                    const radius = 120; 
                    const fontSize = Math.max(10, Math.min(14, 110 / totalPrizes + 3));
                    
                    return (
                        <div
                            key={prize.id}
                            className="absolute top-1/2 left-1/2 origin-left pointer-events-none flex items-center justify-center"
                            style={{
                                transform: `rotate(${midAngle}deg) translateX(${radius}px)`,
                                width: '100px',
                                marginLeft: '-50px' 
                            }}
                        >
                            <span 
                                className="block text-white font-bold text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{
                                    fontSize: `${fontSize}px`,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    maxWidth: '100px'
                                }}
                            >
                                {prize.name}
                            </span>
                        </div>
                    );
                })}
                
                {/* Static Center Area (Does not rotate) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (onSpin) onSpin();
                        }}
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-2xl flex items-center justify-center border-4 overflow-hidden bg-white cursor-pointer transition-all"
                        style={{
                            borderColor: colors.primary,
                        }}
                    >
                        {logoUrl ? (
                            <div className="w-full h-full p-2 flex items-center justify-center bg-white">
                                <img
                                    src={logoUrl}
                                    alt="Center Logo"
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                        try {
                                            // Try a graceful fallback: replace broken image src with an inline SVG badge
                                            const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
                                                <rect width='100%' height='100%' fill='${colors.centerBg}' />
                                                <circle cx='100' cy='100' r='70' fill='${colors.primary}' />
                                                <text x='100' y='115' font-size='48' text-anchor='middle' fill='${colors.centerText}' font-family='Arial, Helvetica, sans-serif' font-weight='700'>LOGO</text>
                                            </svg>`;
                                            const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
                                            (e.target as HTMLImageElement).onerror = null;
                                            (e.target as HTMLImageElement).src = dataUrl;
                                        } catch (err) {
                                            // fallback: do nothing, keep original element (no innerHTML replacement)
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }
                                    }}
                                />
                            </div>
                        ) : (
                            <span 
                                className="font-black text-lg md:text-xl tracking-tighter"
                                style={{ color: colors.primary }}
                            >
                                SPIN
                            </span>
                        )}
                    </motion.div>
                </div>
                
                {/* Top arrow pointer */}
                <div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20"
                ></div>
            </div>
        </div>
    );
}
