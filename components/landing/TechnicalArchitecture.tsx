'use client';

import { motion } from 'framer-motion';
import { BarChart3, MessageSquare, Play, Repeat, ShieldCheck, Smartphone } from 'lucide-react';

const steps = [
  {
    icon: Smartphone,
    title: "QR Scan",
    desc: "Customer scans QR at store/entry",
    color: "bg-blue-500",
    shadow: "shadow-blue-500/20"
  },
  {
    icon: MessageSquare,
    title: "WhatsApp OTP",
    desc: "6-digit verification via WhatsApp",
    color: "bg-green-500",
    shadow: "shadow-green-500/20"
  },
  {
    icon: Play,
    title: "Spin & Win",
    desc: "Engaging game flow on phone",
    color: "bg-purple-500",
    shadow: "shadow-purple-500/20"
  },
  {
    icon: ShieldCheck,
    title: "Verification",
    desc: "Adaptive anti-fraud processing",
    color: "bg-amber-500",
    shadow: "shadow-amber-500/20"
  },
  {
    icon: BarChart3,
    title: "Analytics",
    desc: "Real-time CRM & LTV update",
    color: "bg-cyan-500",
    shadow: "shadow-cyan-500/20"
  },
  {
    icon: Repeat,
    title: "Retention",
    desc: "Automated WhatsApp re-engagement",
    color: "bg-rose-500",
    shadow: "shadow-rose-500/20"
  }
];

export function TechnicalArchitecture() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider border border-slate-200 mb-6">
            The Data Pipeline
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            How LeadSpin Powers Growth
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A seamless, high-performance data flow designed for maximum conversion and zero friction.
          </p>
        </div>

        <div className="relative">
          {/* Animated Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 z-0">
            <motion.div 
              initial={{ width: "0%" }}
              whileInView={{ width: "100%" }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-rose-500 relative"
            >
              <motion.div 
                animate={{ x: ["0%", "100%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 right-0 w-24 h-full bg-white/40 blur-sm"
              />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
            {steps.map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center group"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`${step.color} ${step.shadow} w-20 h-20 rounded-2xl flex items-center justify-center text-white mb-6 relative shadow-xl transition-all duration-300 group-hover:shadow-2xl`}
                >
                  <step.icon className="w-10 h-10" />
                  
                  {/* Step Number Badge */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-[10px] font-bold">
                    0{i + 1}
                  </div>

                  {/* Connecting Line (Mobile/Tablet) */}
                  <div className="lg:hidden absolute -bottom-8 left-1/2 w-0.5 h-8 bg-slate-200 -translate-x-1/2 last:hidden" />
                </motion.div>
                
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed max-w-[160px]">
                  {step.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
