'use client';

import { motion } from 'framer-motion';
import { Instagram, Share2, Smartphone, Sparkles, UserCheck, Wand2 } from 'lucide-react';

const steps = [
  {
    title: "QR Entry & Verify",
    desc: "Customer scans QR at store. Fast OTP verification via WhatsApp for identity.",
    icon: Smartphone,
    color: "bg-blue-500",
    tag: "Security"
  },
  {
    title: "Bonus Unlock",
    desc: "Customer spins & wins. We offer 'Bonus Spins' for Instagram follow.",
    icon: Wand2,
    color: "bg-pink-500",
    tag: "Incentive"
  },
  {
    title: "Adaptive Verification",
    desc: "Low traffic? Managers approve. High traffic? AI verify or statistical sampling.",
    icon: UserCheck,
    color: "bg-purple-500",
    tag: "Efficiency"
  },
  {
    title: "Viral Loop",
    desc: "Bonus spins granted. Customer spins again, shares win on WhatsApp.",
    icon: Share2,
    color: "bg-emerald-500",
    tag: "Growth"
  }
];

export function SocialMediaFlow() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="lg:flex items-center gap-20">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2 mb-12 lg:mb-0"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-pink-100 text-pink-600 text-xs font-bold uppercase tracking-wider border border-pink-200 mb-6">
              Growth Playbook
            </span>
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-slate-900 leading-tight">
              The Social-to-Sale <br />
              <span className="text-pink-600">Verification Engine</span>
            </h2>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed">
              Our adaptive verification system ensures your following grows with real customers, not bots. It scales automatically based on your store's traffic.
            </p>

            <div className="space-y-8">
              {steps.map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex gap-6 items-start group"
                >
                  <div className={`w-14 h-14 rounded-2xl ${step.color} flex-shrink-0 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
                    <step.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-lg text-slate-900">{step.title}</h4>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded leading-none">
                        {step.tag}
                      </span>
                    </div>
                    <p className="text-slate-500 leading-relaxed text-sm">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <div className="lg:w-1/2 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative z-10"
            >
              {/* Mock UI for Verification Pool */}
              <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl border border-slate-700">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center">
                      <Instagram className="text-white w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">Follow Verification Pool</h4>
                      <p className="text-slate-400 text-xs">Processing 128 items/min</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold animate-pulse">
                    Live Engine
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    { user: "@priya_travels", status: "AI Verified", progress: 100 },
                    { user: "@rahul_m", status: "AI Verified", progress: 100 },
                    { user: "@ananya_k", status: "Manual Check", progress: 65, manual: true },
                    { user: "@vikram_s", status: "AI Verified", progress: 100 },
                    { user: "@neha_p", status: "AI Verified", progress: 100 }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                      className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-white uppercase">
                          {item.user[1]}
                        </div>
                        <div>
                          <p className="text-white text-xs font-bold">{item.user}</p>
                          <p className="text-slate-500 text-[10px]">{item.status}</p>
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${item.progress}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 1 }}
                          className={`h-full ${item.manual ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center">
                  <div className="px-6 py-3 bg-white/10 rounded-2xl border border-white/20 text-white text-xs font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Increased Social Reach by 312% this week
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500/20 blur-[100px] z-0" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] z-0" />
          </div>
        </div>
      </div>
    </section>
  );
}
