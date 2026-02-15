'use client';

import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

// Count-up animation hook
function useCountUp(end: number, duration: number = 2000) {
    const [count, setCount] = useState(0);
    const nodeRef = useRef<HTMLDivElement>(null);
    const inView = useInView(nodeRef, { once: true });

    useEffect(() => {
        if (!inView) return;

        let startTime: number | null = null;
        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }, [inView, end, duration]);

    return { count, ref: nodeRef };
}

export function HeroSection() {
    const { count: companyCount, ref: companyRef } = useCountUp(2500);
    
    return (
        <section className="relative pt-20 pb-28 overflow-hidden bg-gradient-to-br from-[#fafbfc] via-slate-50 to-[#fafbfc]">
            {/* Animated Background decorations */}
            <motion.div 
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3]
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute -top-40 -right-40 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"
            />
            <motion.div 
                animate={{
                    scale: [1, 1.1, 1],
                    opacity: [0.3, 0.4, 0.3]
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"
            />
            <motion.div 
                animate={{
                    rotate: [0, 360],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-cyan-500/5 to-cyan-600/5 rounded-full blur-3xl"
            ></motion.div>
            
            <div className="max-w-7xl mx-auto px-6 lg:px-20 grid lg:grid-cols-2 gap-12 lg:gap-20 items-center relative z-10">
                {/* Left Content */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="max-w-2xl"
                >
                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-slate-900 leading-[1.2] lg:leading-[1.1] mb-6 lg:mb-8">
                        The All-in-One Customer <span className="text-cyan-600">Growth Suite</span>
                    </h1>
                    
                    <p className="text-xl text-slate-600 leading-relaxed mb-12 max-w-lg">
                        Replace 5+ apps with one platform. From <strong className="text-slate-900 font-semibold">Zero-Fraud</strong> spin wheels to automated <strong className="text-slate-900 font-semibold">WhatsApp CRM</strong>—everything you need to turn foot traffic into ROI.
                    </p>
                    
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        className="flex flex-col sm:flex-row gap-4 sm:gap-4 mb-8"
                    >
                        <Link href="/admin/signup" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg shadow-cyan-500/30 transition-all duration-300 hover:-translate-y-1 active:scale-95 group text-center">
                            Start Free Trial
                            <span className="inline-block ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
                        </Link>
                        <button className="w-full sm:w-auto bg-white border-2 border-gray-200 hover:border-cyan-500/50 text-slate-900 px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 hover:shadow-lg active:scale-95 group">
                            <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            Book a Demo
                        </button>
                    </motion.div>

                    {/* Feature badges ticker with stagger */}
                    <motion.div 
                        initial="hidden"
                        animate="show"
                        variants={{
                            hidden: { opacity: 0 },
                            show: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.1,
                                    delayChildren: 0.5
                                }
                            }
                        }}
                        className="flex flex-wrap gap-3 mb-12 items-center"
                    >
                        {['QR Standees', 'Analytics Dashboard', 'Custom Templates', 'Code Embedding', 'Manager Controls'].map((badge, i) => {
                            const colors = [
                                'bg-cyan-100 text-cyan-700 border-cyan-200',
                                'bg-amber-100 text-amber-700 border-amber-200',
                                'bg-green-100 text-green-700 border-green-200',
                                'bg-blue-100 text-blue-700 border-blue-200',
                                'bg-purple-100 text-purple-700 border-purple-200'
                            ];
                            return (
                                <motion.span
                                    key={i}
                                    variants={{
                                        hidden: { opacity: 0, y: 20 },
                                        show: { opacity: 1, y: 0 }
                                    }}
                                    className={`px-4 py-1.5 ${colors[i]} rounded-full text-xs font-bold border uppercase tracking-wider shadow-sm`}
                                >
                                    {badge}
                                </motion.span>
                            );
                        })}
                    </motion.div>
                    
                    {/* Trust indicators with count-up */}
                    <div className="pt-8 border-t border-gray-200">
                        <div className="flex items-center gap-8 flex-wrap">
                            <div className="flex items-center gap-2">
                                <div className="flex -space-x-2">
                                    <div className="size-8 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-white"></div>
                                    <div className="size-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 border-2 border-white"></div>
                                    <div className="size-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-2 border-white"></div>
                                </div>
                                <div className="text-sm">
                                    <div ref={companyRef} className="font-bold text-slate-900">{companyCount.toLocaleString()}+</div>
                                    <div className="text-slate-600 text-xs">Happy Companies</div>
                                </div>
                            </div>
                            
                            <div className="h-8 w-px bg-gray-200"></div>
                            
                            <div className="text-sm">
                                <div className="flex items-center gap-1 mb-1">
                                    <span className="text-amber-500">★★★★★</span>
                                </div>
                                <div className="text-slate-600 text-xs">4.9/5 Rating</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Content - Phone Mockup with Parallax */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                    className="relative animate-float"
                >
                    {/* Glow effect with pulse */}
                    <motion.div 
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.2, 0.3, 0.2]
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-cyan-600/20 blur-3xl rounded-full scale-75"
                    ></motion.div>
                    
                    <div className="relative mx-auto max-w-[300px] w-full aspect-[300/620] bg-slate-900 rounded-[3.5rem] border-[10px] border-slate-900 shadow-2xl overflow-hidden">
                        {/* Notch */}
                        <div className="h-7 w-28 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-3xl z-10 shadow-lg"></div>
                        
                        {/* Screen content - Scrolling Campaign Demo */}
                        <div className="h-full overflow-hidden bg-gradient-to-br from-white to-gray-50">
                            <div className="h-[150%] animate-phone-scroll">
                                {/* Section 1: Spinner */}
                                <div className="h-[66.67%] p-6 flex flex-col items-center justify-center gap-4">
                                    <div className="text-center space-y-1">
                                        <h4 className="font-bold text-slate-900 text-base">Spin & Win!</h4>
                                        <p className="text-[10px] text-slate-600">Good luck! 🎉</p>
                                    </div>
                                    
                                    {/* Spinning Wheel */}
                                    <div className="relative size-44 rounded-full border-8 border-white shadow-2xl flex items-center justify-center">
                                        <div className="absolute inset-0 rounded-full border-4 border-white shadow-inner animate-spin"
                                             style={{
                                                 background: 'conic-gradient(from 0deg, #0f172a 0deg 45deg, #f59e0b 45deg 90deg, #0f172a 90deg 135deg, #f59e0b 135deg 180deg, #0f172a 180deg 225deg, #f59e0b 225deg 270deg, #0f172a 270deg 315deg, #f59e0b 315deg 360deg)'
                                             }}>
                                        </div>
                                        <div className="absolute size-4 bg-white rounded-full shadow-lg z-10 border-2 border-slate-900"></div>
                                        <div className="absolute -top-1 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[16px] border-t-slate-900 z-20 drop-shadow-lg"></div>
                                    </div>
                                    
                                    {/* Spin Button */}
                                    <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-amber-500/40">
                                        SPIN NOW
                                    </button>
                                    
                                    {/* Social Tasks Preview */}
                                    <div className="w-full space-y-2 mt-4">
                                        <div className="flex items-center justify-between p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">f</div>
                                                <span className="text-[10px] font-semibold text-slate-700">Follow Us</span>
                                            </div>
                                            <span className="text-[9px] bg-cyan-500 text-white px-2 py-1 rounded-full font-bold">+1</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-green-500/5 rounded-xl border border-green-500/10">
                                            <div className="flex items-center gap-2">
                                                <div className="size-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">↗</div>
                                                <span className="text-[10px] font-semibold text-slate-700">Share</span>
                                            </div>
                                            <span className="text-[9px] bg-green-500 text-white px-2 py-1 rounded-full font-bold">+2</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Section 2: Featured Products */}
                                <div className="h-[66.67%] bg-gradient-to-br from-slate-800 to-slate-900 p-6 flex flex-col gap-4">
                                    <div>
                                        <h3 className="text-white text-sm font-bold mb-1">Featured Highlights</h3>
                                        <div className="h-0.5 w-12 bg-amber-500 rounded-full"></div>
                                    </div>
                                    
                                    {/* Product Card 1 */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                                        <div className="h-28 bg-gradient-to-br from-amber-400 to-orange-500 relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-white/30 text-6xl">🎁</div>
                                            </div>
                                            <div className="absolute bottom-2 left-2">
                                                <span className="bg-amber-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">Premium</span>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="text-white text-xs font-bold mb-1">Wellness Bundle</h4>
                                            <p className="text-white/60 text-[9px] leading-tight">Curated collection of premium products</p>
                                        </div>
                                    </div>
                                    
                                    {/* Product Card 2 */}
                                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20">
                                        <div className="h-24 bg-gradient-to-br from-cyan-400 to-blue-500 relative">
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-white/30 text-5xl">🌿</div>
                                            </div>
                                            <div className="absolute bottom-2 left-2">
                                                <span className="bg-cyan-500 text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">Popular</span>
                                            </div>
                                        </div>
                                        <div className="p-3">
                                            <h4 className="text-white text-xs font-bold mb-1">Nature Kit</h4>
                                            <p className="text-white/60 text-[9px] leading-tight">Eco-friendly essentials</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
