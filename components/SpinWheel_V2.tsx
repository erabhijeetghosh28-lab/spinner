'use client';

import { useAnimation } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Template1Wheel_V2 from './wheel-templates/Template1Wheel_V2';
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
    templateName?: string;
    selectedPrizeIndex?: number;
    logoUrl?: string | null;
    onTick?: () => void;
    onSpinClick?: () => void;
    disabled?: boolean;
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

    const segmentAngle = 360 / prizes.length;
    
    // DEBUG: Check which template is active
    console.log('Current Template Name:', templateName);



    // Speed Configuration
    const SPIN_SPEED_DPS = 720; // 2 rotations per second
    const DECEL_DURATION = 4; // Snappy stop
    
    const spinStartTimeRef = React.useRef<number>(0);

    // Phase 1: Infinite Spin (Waiting for API)
    useEffect(() => {
        if (externalIsSpinning && selectedPrizeIndex === undefined && !isSpinning) {
            setIsSpinning(true);
            spinStartTimeRef.current = Date.now();
            
            // Continuous fast spin at defined speed
            // To spin for 100s, we rotate 100 * SPEED
            controls.start({
                rotate: currentRotation + (SPIN_SPEED_DPS * 100), 
                transition: { duration: 100, ease: "linear" }
            });
        }
    // NOTE: intentionally omit `currentRotation` and `controls` from deps to avoid update loops.
    }, [externalIsSpinning, selectedPrizeIndex, isSpinning]);

    // Phase 2: Landing (API returned)
    const landingAnimatingRef = React.useRef(false);
    useEffect(() => {
        if (externalIsSpinning && selectedPrizeIndex !== undefined && !landingAnimatingRef.current) {
            landingAnimatingRef.current = true;

            // Ensure internal spinning flag is set so animation logic runs consistently
            if (!isSpinning) {
                setIsSpinning(true);
            }

            const prizeIndex = selectedPrizeIndex;
            const targetPrizeAngle = (360 - (prizeIndex * segmentAngle)) - (segmentAngle / 2);

            // 1. Calculate where we visually are right now
            const elapsedSeconds = (Date.now() - spinStartTimeRef.current) / 1000;
            const estimatedCurrentRotation = currentRotation + (SPIN_SPEED_DPS * elapsedSeconds);

            // 2. Calculate Distance needed to decelerate smoothly from SPIN_SPEED
            const baseDecelDistance = 0.5 * SPIN_SPEED_DPS * DECEL_DURATION;

            // 3. Align to target
            const currentMod = estimatedCurrentRotation % 360;
            const distToNextImg = 360 - currentMod;
            const rotationsNeeded = Math.ceil(baseDecelDistance / 360);

            const baseRotation = Math.ceil(estimatedCurrentRotation / 360) * 360;
            const newRotation = baseRotation + (360 * rotationsNeeded) + targetPrizeAngle;

            setCurrentRotation(newRotation);

            // 4. Animate to final position
            controls.start({
                rotate: newRotation,
                transition: { duration: DECEL_DURATION, ease: "easeOut" }
            }).then(() => {
                landingAnimatingRef.current = false;
                setIsSpinning(false);
                onFinished(prizes[prizeIndex]);
            }).catch((err) => {
                landingAnimatingRef.current = false;
                setIsSpinning(false);
                console.error('Spin animation error:', err);
            });
        }
    // NOTE: intentionally omit `currentRotation` and `controls` from deps to avoid update loops.
    }, [selectedPrizeIndex, prizes, segmentAngle, onFinished, externalIsSpinning]);

    if (prizes.length === 0) {
        return (
            <div className="relative w-80 h-80 md:w-[400px] md:h-[400px] mx-auto flex items-center justify-center">
                <div className="text-slate-400 text-sm">No prizes available</div>
            </div>
        );
    }

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
                cursor: isSpinning || externalIsSpinning ? 'not-allowed' : 'pointer',
                pointerEvents: isSpinning || externalIsSpinning ? 'none' : 'auto',
                backgroundColor: 'transparent'
            }}
        >
            <div className="absolute inset-0 w-full h-full">
                 {(templateName === 'template_1' || !templateName) && (
                     <Template1Wheel_V2
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                 )}
                 {templateName === 'template_2' && (
                     <Template2Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                 )}
                 {templateName === 'template_3' && (
                     <Template3Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                 )}
                 {templateName === 'template_4' && (
                     <Template4Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                 )}
                 {templateName === 'template_5' && (
                     <Template5Wheel
                        prizes={prizes}
                        controls={controls}
                        segmentAngle={segmentAngle}
                    />
                 )}
            </div>
            
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-30 pointer-events-none"></div>
        </div>
    );
};

export default SpinWheel;
