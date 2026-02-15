'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Instagram, MessageCircle, Play, Smartphone, Sparkles, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const steps = [
  { id: 1, title: "QR Scan", icon: Smartphone, color: "bg-blue-500" },
  { id: 2, title: "WhatsApp OTP", icon: MessageCircle, color: "bg-green-500" },
  { id: 3, title: "The Game", icon: Play, color: "bg-purple-500" },
  { id: 4, title: "Verification", icon: CheckCircle2, color: "bg-amber-500" },
  { id: 5, title: "Success", icon: Sparkles, color: "bg-emerald-500" }
];

export function LiveDemoPreview() {
  const [activeStep, setActiveStep] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep(s => (s < 5 ? s + 1 : 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-24 bg-slate-900 overflow-hidden" id="demo">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="px-4 py-2 rounded-full bg-blue-500/10 text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-500/20 mb-6 inline-block">
            Experience LeadSpin
          </span>
          <h2 className="text-4xl md:text-6xl font-black mb-6 text-white leading-tight">
            See the Magic <span className="text-blue-500">In Action</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            Click through the automated journey your customers will experience. Zero friction, maximum delight.
          </p>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Progress Bar */}
          <div className="flex justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
            <motion.div 
              className="absolute top-1/2 left-0 h-0.5 bg-blue-500 -translate-y-1/2 z-0"
              animate={{ width: `${(activeStep - 1) * 25}%` }}
              transition={{ duration: 0.5 }}
            />
            {steps.map(step => (
              <button 
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all border-2 ${
                  activeStep >= step.id ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
              >
                <step.icon className="w-5 h-5" />
              </button>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone Mockup */}
            <div className="relative flex justify-center">
              <div className="relative w-[280px] h-[580px] bg-slate-800 rounded-[3rem] border-[8px] border-slate-700 shadow-2xl overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-700 rounded-b-xl z-20" />
                
                {/* Screen Content */}
                <div className="relative h-full bg-white p-6 pt-12">
                  {activeStep === 1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-48 h-48 bg-slate-100 rounded-3xl flex items-center justify-center mb-8 border-2 border-dashed border-slate-200">
                        <QRCode value="https://leadspin.demo" className="w-32 h-32 text-slate-800" />
                      </div>
                      <h4 className="font-black text-slate-900 text-xl mb-4">Welcome to Caffeine Club</h4>
                      <p className="text-slate-500 text-sm">Scan now to join our VIP club and win exclusive rewards.</p>
                    </motion.div>
                  )}

                  {activeStep === 2 && (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="h-full flex flex-col justify-center">
                      <div className="bg-emerald-50 rounded-2xl p-4 mb-6 border border-emerald-100 flex items-center gap-3">
                        <MessageCircle className="text-emerald-600 w-6 h-6 flex-shrink-0" />
                        <p className="text-emerald-800 text-xs font-bold leading-none">WhatsApp OTP Sent</p>
                      </div>
                      <h4 className="font-black text-slate-900 text-xl mb-6">Verify Phone</h4>
                      <div className="flex gap-2 mb-8">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                          <div key={i} className="flex-1 h-12 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-bold text-slate-900">
                            {i === 1 ? '4' : i === 2 ? '8' : ''}
                          </div>
                        ))}
                      </div>
                      <button className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-500/20">Verify & Continue</button>
                    </motion.div>
                  )}

                  {activeStep === 3 && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center relative">
                      <div className="relative w-56 h-56 rounded-full border-8 border-slate-100 shadow-xl flex items-center justify-center overflow-hidden">
                        <motion.div 
                          animate={{ rotate: isSpinning ? 1800 : 0 }} 
                          transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
                          className="w-full h-full"
                          style={{
                            background: 'conic-gradient(#3b82f6 0% 12.5%, #8b5cf6 12.5% 25%, #3b82f6 25% 37.5%, #8b5cf6 37.5% 50%, #3b82f6 50% 62.5%, #8b5cf6 62.5% 75%, #3b82f6 75% 87.5%, #8b5cf6 87.5% 100%)'
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => (
                              <div 
                                key={deg} 
                                className="absolute w-full h-0.5 bg-white/20" 
                                style={{ transform: `rotate(${deg}deg)` }} 
                              />
                            ))}
                          </div>
                        </motion.div>
                        <div className="absolute inset-0 border-[12px] border-white/40 rounded-full" />
                        <div className="absolute w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center z-10">
                            <div className="w-8 h-8 rounded-full border-4 border-slate-100" />
                        </div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-4 h-8 bg-slate-900 rounded-full z-20 shadow-lg" />
                      </div>
                      <button 
                        onClick={() => setIsSpinning(true)}
                        className="mt-12 px-8 py-3 bg-blue-600 text-white rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-transform"
                      >
                        {isSpinning ? 'Winning...' : 'Spin Now!'}
                      </button>
                    </motion.div>
                  )}

                  {activeStep === 4 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
                        <Wand2 className="text-amber-600 w-10 h-10 animate-pulse" />
                      </div>
                      <h4 className="font-black text-slate-900 text-xl mb-4">Bonus Unlock!</h4>
                      <p className="text-slate-500 text-sm mb-8">Follow us on Instagram to get 2 extra spins and exclusive prizes.</p>
                      <button className="w-full py-4 bg-pink-600 text-white rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-pink-500/20">
                        <Instagram className="w-5 h-5" />
                        Connect Instagram
                      </button>
                    </motion.div>
                  )}

                  {activeStep === 5 && (
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/40">
                        <CheckCircle2 className="text-white w-12 h-12" />
                      </div>
                      <h4 className="font-black text-slate-900 text-2xl mb-4">You Won!</h4>
                      <p className="text-slate-500 text-sm mb-8">Your 20% OFF Voucher has been sent to your WhatsApp.</p>
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 w-full">
                        <p className="text-xs text-slate-400 mb-1 uppercase tracking-widest font-black">Voucher Code</p>
                        <p className="text-xl font-bold text-slate-900">VIP_GIFT_2024</p>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Dynamic Glow */}
              <div className="absolute -inset-10 bg-blue-500/20 blur-[100px] rounded-full z-0 opacity-50" />
            </div>

            {/* Content Side */}
            <motion.div 
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl ${steps[activeStep-1].color} flex items-center justify-center text-white shadow-xl`}>
                  {(() => {
                    const Icon = steps[activeStep-1].icon;
                    return <Icon className="w-6 h-6" />;
                  })()}
                </div>
                <h3 className="text-2xl font-black text-white">{steps[activeStep-1].title}</h3>
              </div>
              
              <p className="text-xl text-slate-400 leading-relaxed italic">
                {activeStep === 1 && "Start the journey with a touch. Our branded QR posters capture attention and provide a clean entry point."}
                {activeStep === 2 && "Ditch legacy forms. We use WhatsApp for zero-摩擦 high-trust verification that captures a real lead every time."}
                {activeStep === 3 && "Gamification that works. High-performance spin wheels and scratch cards increase engagement by 312% on average."}
                {activeStep === 4 && "Turn engagement into growth. Incentive loyalty by rewarding social tasks with automated verification."}
                {activeStep === 5 && "The virtuous cycle. Instant prize delivery via WhatsApp and real-time CRM updates for your staff."}
              </p>

              <div className="pt-8 grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-blue-400 text-3xl font-black mb-1">0{activeStep}</p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Journey Phase</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <p className="text-emerald-400 text-3xl font-black mb-1">
                    {activeStep === 1 ? "1.2s" : activeStep === 2 ? "98%" : activeStep === 3 ? "4.2x" : activeStep === 4 ? "312%" : "Instant"}
                  </p>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    {activeStep === 1 ? "Load Speed" : activeStep === 2 ? "Success Rate" : activeStep === 3 ? "CTR" : activeStep === 4 ? "Follower ROI" : "Delivery"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { QRCodeSVG as QRCode } from 'qrcode.react';
