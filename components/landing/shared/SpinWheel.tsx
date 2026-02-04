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
}

export default function SpinWheel({ 
    variant = 'light', 
    onSpin,
    className = '',
    prizes = [],
    customColors 
}: SpinWheelProps) {
    // Color configurations for each variant
    const getVariantColors = () => {
        if (variant === 'custom' && customColors) {
            return {
                ...customColors,
                gradient: `conic-gradient(
                    ${customColors.primary} 0deg 45deg,
                    ${customColors.secondary} 45deg 90deg,
                    ${customColors.primary} 90deg 135deg,
                    ${customColors.secondary} 135deg 180deg,
                    ${customColors.primary} 180deg 225deg,
                    ${customColors.secondary} 225deg 270deg,
                    ${customColors.primary} 270deg 315deg,
                    ${customColors.secondary} 315deg 360deg
                )`
            };
        }

        const variants = {
            light: {
                primary: '#f48c25',
                secondary: '#1e293b',
                border: '#1e293b',
                centerBg: 'white',
                centerText: '#f48c25',
                gradient: `conic-gradient(
                    #f48c25 0deg 45deg,
                    #1e293b 45deg 90deg,
                    #f48c25 90deg 135deg,
                    #334155 135deg 180deg,
                    #f48c25 180deg 225deg,
                    #1e293b 225deg 270deg,
                    #f48c25 270deg 315deg,
                    #475569 315deg 360deg
                )`
            },
            dark: {
                primary: '#f48c25',
                secondary: '#0a0f1d',
                border: '#334155',
                centerBg: '#1e293b',
                centerText: '#f48c25',
                gradient: `conic-gradient(
                    #f48c25 0deg 45deg,
                    #0a0f1d 45deg 90deg,
                    #f48c25 90deg 135deg,
                    #161e2e 135deg 180deg,
                    #f48c25 180deg 225deg,
                    #0a0f1d 225deg 270deg,
                    #f48c25 270deg 315deg,
                    #161e2e 315deg 360deg
                )`
            },
            cyan: {
                primary: '#00f2ff',
                secondary: '#0a0f1d',
                border: '#161e2e',
                centerBg: '#161e2e',
                centerText: '#00f2ff',
                gradient: `conic-gradient(
                    #00f2ff 0deg 45deg,
                    #0a0f1d 45deg 90deg,
                    #00f2ff 90deg 135deg,
                    #161e2e 135deg 180deg,
                    #00f2ff 180deg 225deg,
                    #0a0f1d 225deg 270deg,
                    #00f2ff 270deg 315deg,
                    #161e2e 315deg 360deg
                )`
            }
        };

        return variants[variant as keyof typeof variants] || variants.light;
    };

    const colors = getVariantColors();

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
                    const angle = (360 / totalPrizes) * index;
                    const radius = 140; // Distance from center for md screens
                    
                    return (
                        <div
                            key={prize.id}
                            className="absolute top-1/2 left-1/2 origin-left pointer-events-none"
                            style={{
                                transform: `rotate(${angle + (180 / totalPrizes)}deg) translateX(${radius}px)`,
                                width: '100px',
                            }}
                        >
                            <span 
                                className="block text-white font-bold text-xs md:text-sm text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                                style={{
                                    transform: `rotate(90deg)`,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {prize.name}
                            </span>
                        </div>
                    );
                })}
                
                {/* Center SPIN button */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSpin}
                    className="z-10 w-20 h-20 md:w-28 md:h-28 rounded-full shadow-xl flex items-center justify-center border-4 cursor-pointer transition-all"
                    style={{
                        backgroundColor: colors.centerBg,
                        borderColor: colors.primary,
                        color: colors.centerText
                    }}
                >
                    <span className="font-black text-lg md:text-xl tracking-tighter">SPIN</span>
                </motion.div>
                
                {/* Top arrow pointer */}
                <div 
                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20"
                ></div>
            </div>
        </div>
    );
}
