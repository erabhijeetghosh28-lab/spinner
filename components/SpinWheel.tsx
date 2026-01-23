'use client';

import React, { useState, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import Template1Wheel from './wheel-templates/Template1Wheel';
import Template2Wheel from './wheel-templates/Template2Wheel';
import Template3Wheel from './wheel-templates/Template3Wheel';
import Template4Wheel from './wheel-templates/Template4Wheel';
import Template5Wheel from './wheel-templates/Template5Wheel';

interface Prize {
    id: string;
    name: string;
    colorCode?: string;
}

interface SpinWheelProps {
    prizes: Prize[];
    onFinished: (prize: Prize) => void;
    isSpinning?: boolean;
    templateName?: string; // e.g., 'template_1', 'template_2' - determines wheel styling (colors are automatic based on template)
    selectedPrizeIndex?: number; // Index of prize to land on (from backend)
    logoUrl?: string | null;
    onTick?: () => void; // Callback for tick sound during spin
    onSpinClick?: () => void; // Click handler for spinning
    disabled?: boolean; // Whether wheel is disabled
}

const SpinWheel: React.FC<SpinWheelProps> = ({
    prizes,
    onFinished,
    isSpinning: externalIsSpinning,
    templateName = 'template_1',
    selectedPrizeIndex,
    logoUrl,
    onTick,
    onSpinClick,
    disabled = false
}) => {
    const [isSpinning, setIsSpinning] = useState(false);
    const [currentRotation, setCurrentRotation] = useState(0);
    const controls = useAnimation();

    // Handle empty prizes
    if (prizes.length === 0) {
        return (
            <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] mx-auto flex items-center justify-center">
                <div className="text-slate-400 text-sm">No prizes available</div>
            </div>
        );
    }

    const segmentAngle = 360 / prizes.length;
    
    // Wheel styling is determined by template name - each template has its own wheel design
    // For now, Template1 uses Template1Wheel. Other templates will have their own wheel components.
    const renderWheel = () => {
        switch (templateName) {
            case 'template_1':
                return (
                    <Template1Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                );
            case 'template_2':
                return (
                    <Template2Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                );
            case 'template_3':
                return (
                    <Template3Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                );
            case 'template_4':
                return (
                    <Template4Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                );
            case 'template_5':
                return (
                    <Template5Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                );
            default:
                return (
                    <Template1Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                );
        }
    };

    const spin = async () => {
        if (isSpinning) return;
        setIsSpinning(true);

        // Use selectedPrizeIndex if provided (from backend), otherwise random
        const prizeIndex = selectedPrizeIndex !== undefined
            ? selectedPrizeIndex
            : Math.floor(Math.random() * prizes.length);

        // Final position for the arrow to land on the center of the segment
        const targetPrizeAngle = (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2);

        // Cumulative rotation: Ensure we always spin forward by adding to current state
        const baseRotation = Math.ceil(currentRotation / 360) * 360;
        const newRotation = baseRotation + (360 * 5) + targetPrizeAngle;

        setCurrentRotation(newRotation);

        // Play tick sounds during deceleration (last 2 seconds)
        let tickInterval: NodeJS.Timeout | null = null;
        const startTickTime = Date.now() + 3000; // Start ticks 3 seconds into animation

        tickInterval = setInterval(() => {
            if (Date.now() >= startTickTime && onTick) {
                onTick();
            }
        }, 200); // Tick every 200ms during deceleration

        await controls.start({
            rotate: newRotation,
            transition: { duration: 5, ease: [0.17, 0.67, 0.12, 0.99] }
        });

        // Clear tick interval when animation completes
        if (tickInterval) {
            clearInterval(tickInterval);
        }

        setIsSpinning(false);
        onFinished(prizes[prizeIndex]);
    };

    useEffect(() => {
        if (externalIsSpinning && !isSpinning) {
            spin();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [externalIsSpinning, isSpinning]);

    return (
        <div 
            className="relative w-72 h-72 md:w-[400px] md:h-[400px] rounded-full border-8 border-[#1e293b] shadow-2xl overflow-hidden"
            onClick={(e) => {
                e.stopPropagation();
                if (onSpinClick && !disabled && !isSpinning && !externalIsSpinning) {
                    onSpinClick();
                }
            }}
            style={{ 
                cursor: disabled || isSpinning || externalIsSpinning ? 'not-allowed' : 'pointer',
                pointerEvents: disabled || isSpinning || externalIsSpinning ? 'none' : 'auto',
                backgroundColor: 'transparent'
            }}
        >
            {/* Wheel - styling matches the template - segments show orange/dark blue */}
            <div className="absolute inset-0 w-full h-full">
                {renderWheel()}
            </div>
            
            {/* Arrow indicator at top (matching reference) */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-30 pointer-events-none"></div>

            {/* Center Logo (if provided) */}
            {logoUrl && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-900/90 border-4 border-amber-500/50 flex items-center justify-center overflow-hidden shadow-2xl">
                    <img
                        src={logoUrl}
                        alt="Campaign Logo"
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                            // Hide logo if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default SpinWheel;
