'use client';

import { motion } from 'framer-motion';

export function VideoShowcase() {
  return (
    <section className="py-24 bg-slate-900 overflow-hidden relative" id="video-demo">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          {/* Left Text */}
          <div className="lg:w-1/2 order-2 lg:order-1">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/30 mb-6">
                LeadSpin in Action
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 text-white leading-tight">
                Behold the <span className="text-cyan-400">Pure Experience</span>
              </h2>
              <p className="text-xl text-slate-400 leading-relaxed mb-8">
                Experience LeadSpin exactly as your customers do. Our interface is designed for maximum clarity, speed, and conversion—built to look stunning on every display.
              </p>
              
              <div className="space-y-6">
                {[
                  { title: "Crystal Clear Interface", desc: "Edge-to-edge design optimized for high-resolution mobile displays." },
                  { title: "Seamless Automation", desc: "Watch the zero-friction transition from scan to prize delivery." },
                  { title: "Engagement Loops", desc: "See how social tasks are integrated directly into the winning moment." },
                  { title: "Real-time Magic", desc: "Live verification that builds trust and excitement instantly." }
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="mt-1 w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0 shadow-sm shadow-cyan-500/20">
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-lg">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right Video Container - Clean Floating Screen */}
          <div className="lg:w-1/2 w-full flex justify-center order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative w-full max-w-[340px]"
            >
              {/* Premium Floating Frame */}
              <div className="relative aspect-[9/19.5] w-full bg-slate-800 rounded-[2.5rem] overflow-hidden border-[6px] border-slate-800 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6),0_0_40px_-5px_rgba(6,182,212,0.3)] ring-1 ring-white/10">
                {/* Internal Video */}
                <video 
                  src="/assets/promo-video.mp4" 
                  className="w-full h-full object-contain"
                  controls
                  autoPlay={true}
                  muted={true}
                  loop={true}
                  playsInline
                  poster="/spinwheel-logo.svg"
                >
                  Your browser does not support the video tag.
                </video>

                {/* Subtle Reflection Overlay */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 via-transparent to-transparent z-10" />
              </div>

              {/* Dynamic Glow and Decorative Elements */}
              <div className="absolute -inset-16 bg-cyan-500/5 blur-[100px] rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
