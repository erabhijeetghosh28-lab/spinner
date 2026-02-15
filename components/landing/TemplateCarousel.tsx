'use client';

import { AnimatePresence, motion, useAnimation } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info, Palette, Play } from 'lucide-react';
import { useState } from 'react';
import Template1Wheel from '../wheel-templates/Template1Wheel';
import Template2Wheel from '../wheel-templates/Template2Wheel';
import Template3Wheel from '../wheel-templates/Template3Wheel';
import Template4Wheel from '../wheel-templates/Template4Wheel';
import Template5Wheel from '../wheel-templates/Template5Wheel';

const templates = [
  { id: 1, component: Template1Wheel, name: 'Classic Orange', description: 'Our most popular traditional design.', color: '#f48c25' },
  { id: 2, component: Template2Wheel, name: 'Electric Cyan', description: 'Modern, high-contrast neon aesthetic.', color: '#00f2ff' },
  { id: 3, component: Template3Wheel, name: 'Luxury Gold', description: 'Premium elegant design for high-end brands.', color: '#D4AF37' },
  { id: 4, component: Template4Wheel, name: 'Eco Forest', description: 'Calming, earthy tones for sustainable brands.', color: '#2D5A47' },
  { id: 5, component: Template5Wheel, name: 'Ferrari Red', description: 'High-energy layout with bold red accents.', color: '#FF0800' },
];

const mockPrizes = [
  { id: '1', name: '10% OFF' },
  { id: '2', name: 'FREE GIFT' },
  { id: '3', name: 'BUY 1 GET 1' },
  { id: '4', name: '₹500 OFF' },
  { id: '5', name: 'FREE DRINK' },
  { id: '6', name: 'BETTER LUCK' },
];

export function TemplateCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const controls = useAnimation();

  const next = () => {
    if (isSpinning) return;
    setCurrentIndex((prev) => (prev + 1) % templates.length);
  };

  const prev = () => {
    if (isSpinning) return;
    setCurrentIndex((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const spin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const rotation = 360 * 5 + Math.random() * 360;
    await controls.start({
      rotate: rotation,
      transition: { duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }
    });
    setTimeout(() => {
        setIsSpinning(false);
        controls.set({ rotate: 0 });
    }, 1000);
  };

  const ActiveWheel = templates[currentIndex].component;

  return (
    <div className="relative group max-w-xl mx-auto">
      {/* Main Preview Card */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-800 shadow-2xl overflow-hidden aspect-square flex flex-col items-center justify-center relative">
        {/* Background Accents */}
        <div 
            className="absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-20 rounded-full transition-colors duration-700"
            style={{ backgroundColor: templates[currentIndex].color }}
        ></div>
        
        {/* Top Bar UI */}
        <div className="absolute top-6 left-8 right-8 flex items-center justify-between">
            <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
            </div>
            <div className="flex items-center gap-2">
                <Palette className="w-3 h-3 text-slate-500" />
                <span className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">Live Preview</span>
            </div>
        </div>

        {/* The Wheel */}
        <div className="w-full h-full relative z-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.8, rotate: -20 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 1.1, rotate: 20 }}
                    transition={{ duration: 0.5, type: 'spring', damping: 20 }}
                    className="w-[85%] h-[85%]"
                >
                    <ActiveWheel 
                        prizes={mockPrizes} 
                        controls={controls} 
                        segmentAngle={360 / mockPrizes.length} 
                    />
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-slate-800/80 backdrop-blur-2xl px-5 py-3 rounded-2xl border border-white/5 shadow-2xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 z-30">
            <button 
                onClick={prev} 
                disabled={isSpinning}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all disabled:opacity-30"
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
                onClick={spin}
                disabled={isSpinning}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-700 text-slate-900 px-6 py-2.5 rounded-xl font-bold text-sm transition-all transform active:scale-95 shadow-lg shadow-amber-500/20 disabled:text-slate-500"
            >
                {isSpinning ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    <Play className="w-4 h-4 fill-current" />
                )}
                {isSpinning ? 'Spinning...' : 'Test Spin'}
            </button>
            <button 
                onClick={next} 
                disabled={isSpinning}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition-all disabled:opacity-30"
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Info Tab */}
      <motion.div 
        initial={false}
        animate={{ borderLeftColor: templates[currentIndex].color }}
        className="mt-6 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 border-l-4"
      >
        <div className="p-2.5 rounded-xl bg-slate-50 text-slate-400">
            <Info className="w-5 h-5" />
        </div>
        <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2">
                {templates[currentIndex].name}
            </h4>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {templates[currentIndex].description}
            </p>
        </div>
      </motion.div>

      {/* Pagination dots under the carousel */}
      <div className="flex justify-center gap-1.5 mt-6">
        {templates.map((_, i) => (
            <button 
                key={i}
                onClick={() => !isSpinning && setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${i === currentIndex ? 'bg-amber-500 w-8' : 'bg-slate-200 w-3 hover:bg-slate-300'}`}
                disabled={isSpinning}
            />
        ))}
      </div>
    </div>
  );
}
