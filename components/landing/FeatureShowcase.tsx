'use client';

import { motion } from 'framer-motion';
import {
    ArrowRight,
    Badge,
    BarChart3,
    CheckCircle2,
    Code2,
    Instagram,
    LayoutDashboard,
    MessageSquare,
    QrCode,
    Settings,
    ShieldCheck,
    TrendingUp,
    Users,
    Zap
} from 'lucide-react';

import { TemplateCarousel } from './TemplateCarousel';

export function FeatureShowcase() {
  return (
    <div className="space-y-32 py-20">
      {/* 1. Engagement Tools Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <TemplateCarousel />
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider border border-amber-500/20 underline decoration-amber-500/30">
              Engagement Tools
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              Premium Templates that Convert
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Don't settle for generic wheels. Choose from 5+ professionally designed templates that match your brand perfectly. Each template is optimized for high retention and engagement.
            </p>
            <ul className="space-y-4">
              {[
                "Fully customizable colors & branding",
                "Mobile-first responsive design",
                "High-performance animations (60 FPS)",
                "Built-in sound effects & music presets"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-slate-700">
                  <CheckCircle2 className="text-amber-500 w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 2. Analytics & BI Section */}
      <section className="bg-slate-950 py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/20">
              Business Intelligence
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Real-Time Metrics at Your Fingertips
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Track your Monthly Recurring Revenue (MRR), new conversions, and customer churn with our advanced analytics dashboard. Make data-driven decisions that scale your business.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <TrendingUp className="text-emerald-500 w-6 h-6 mb-3" />
                <h4 className="text-white font-bold text-xl">ROI Tracking</h4>
                <p className="text-slate-500 text-sm">Measure exactly how much revenue your campaigns generate.</p>
              </div>
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 backdrop-blur-sm">
                <BarChart3 className="text-blue-500 w-6 h-6 mb-3" />
                <h4 className="text-white font-bold text-xl">Heatmaps</h4>
                <p className="text-slate-500 text-sm">See where customers are engaging the most.</p>
              </div>
            </div>
          </div>
          <div className="relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-3xl rounded-full"></div>
             <div className="relative bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-2xl space-y-6">
               <div className="flex items-center justify-between">
                 <h3 className="text-white font-bold">Revenue Dashboard</h3>
                 <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg text-[10px] font-bold">LIVE</div>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">MRR</div>
                   <div className="text-2xl font-bold text-white">₹45,200</div>
                 </div>
                 <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
                   <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">CPA</div>
                   <div className="text-2xl font-bold text-white">₹12.4</div>
                 </div>
               </div>

               <div className="space-y-4">
                 <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                   <motion.div 
                     initial={{ width: 0 }}
                     whileInView={{ width: '75%' }}
                     transition={{ duration: 1, ease: 'easeOut' }}
                     className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                   />
                 </div>
                 <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   <span>Conversion Goal</span>
                   <span className="text-cyan-400">75% Achieved</span>
                 </div>
               </div>

               <div className="h-32 flex items-end gap-1 px-2">
                 {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                   <motion.div 
                    key={i} 
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    transition={{ duration: 0.8, delay: i * 0.1 }}
                    className="flex-1 bg-gradient-to-t from-cyan-500/20 to-cyan-500 rounded-t-lg"
                   />
                 ))}
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* 3. Management & Control Section */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 blur-3xl rounded-full"></div>
            <div className="relative bg-white rounded-3xl p-8 border border-slate-100 shadow-2xl space-y-6">
              <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Manager Validation</h4>
                  <p className="text-xs text-slate-500">Security & Integrity Layer</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { name: 'Instagram Follow (#8291)', status: 'Pending Approval', colorClass: 'bg-amber-100 text-amber-600' },
                  { name: 'Suspicious Spin Rate Detected', status: 'High Severity', colorClass: 'bg-red-100 text-red-600' },
                  { name: 'User: +91 ******4122', status: 'Verified', colorClass: 'bg-emerald-100 text-emerald-600' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-sm font-semibold text-slate-700">{item.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 ${item.colorClass} rounded-lg uppercase`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>

              <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
                Open Admin Panel
              </button>
            </div>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 text-xs font-bold uppercase tracking-wider border border-purple-500/20">
              Enterprise Control
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              Enterprise-Grade Control & Security
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Managing high-growth campaigns? Our system automatically adapts verification strategies based on traffic volume, from individual validation to statistical sampling.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {[
                { icon: ShieldCheck, text: "Threat Monitoring" },
                { icon: Settings, text: "Adaptive Verification" },
                { icon: LayoutDashboard, text: "PII Masking Protection" },
                { icon: CheckCircle2, text: "Full Audit Transparency" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="text-purple-600 w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-slate-700 text-sm">{item.text}</span>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Social Media Growth Engine (NEW) */}
      <section className="bg-gradient-to-br from-pink-50 to-rose-50 py-24 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 text-pink-600 text-xs font-bold uppercase tracking-wider border border-pink-500/20">
              Viral Growth Mechanics
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">
              Grow Your Social Following on Autopilot
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Reward customers with bonus spins for Instagram follows, Facebook likes, and YouTube subscribes. Our adaptive verification system scales from 1 to 10,000 tasks/hour without API overages.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {[
                { icon: Instagram, text: "Instagram Growth" },
                { icon: Badge, text: "Auto Verification" },
                { icon: TrendingUp, text: "Scales to 10k/hr" },
                { icon: CheckCircle2, text: "Manager Approvals" }
              ].map((item, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <item.icon className="text-pink-600 w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-slate-700 text-sm">{item.text}</span>
                </motion.div>
              ))}
            </ul>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
             <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/20 to-rose-500/20 blur-3xl rounded-full"></div>
             <div className="relative bg-white rounded-3xl p-8 border border-pink-100 shadow-2xl space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                    <Instagram className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Social Task Queue</h4>
                    <p className="text-xs text-slate-500">Pending Manager Approval</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: 'Instagram Follow @brandname', user: '+91 ******4122', status: 'Pending', colorClass: 'bg-amber-100 text-amber-600' },
                    { name: 'Facebook Like - Post #291', user: '+91 ******8934', status: 'Verified ✓', colorClass: 'bg-emerald-100 text-emerald-600' },
                    { name: 'YouTube Subscribe', user: '+91 ******2145', status: 'Pending', colorClass: 'bg-amber-100 text-amber-600' }
                  ].map((item, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.15 }}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <div>
                        <span className="text-sm font-semibold text-slate-700 block">{item.name}</span>
                        <span className="text-xs text-slate-500">{item.user}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 ${item.colorClass} rounded-lg uppercase`}>
                        {item.status}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <button className="w-full py-3 bg-pink-600 text-white rounded-xl font-bold text-sm hover:bg-pink-700 transition-colors">
                  Approve All Tasks
                </button>
             </div>
          </motion.div>
        </div>
      </section>

      {/* 5. Automated WhatsApp CRM Section */}
      <section className="bg-emerald-950 py-24 overflow-hidden relative rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 relative">
             <div className="absolute -inset-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-3xl rounded-full"></div>
             <div className="relative bg-slate-900/80 rounded-3xl p-6 border border-emerald-500/20 shadow-2xl backdrop-blur-md">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">WhatsApp Business API</h4>
                    <p className="text-[10px] text-emerald-400">Automated Messaging Active</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 self-start max-w-[80%]">
                    <p className="text-white text-xs leading-relaxed">
                      🎉 *Congratulations!* You won: *Premium Wellness Bundle*
                      Voucher Code: *WLL-9281-X*
                    </p>
                    <div className="mt-2 w-full aspect-square bg-white rounded-lg p-2 flex items-center justify-center">
                      <QrCode className="text-slate-900 w-full h-full opacity-80" />
                    </div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-2xl self-end max-w-[70%] ml-auto">
                    <p className="text-slate-400 text-[10px]">How do I claim this?</p>
                  </div>
                  <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 self-start max-w-[80%]">
                    <p className="text-white text-xs">Just show the QR code at our store outlet! 📍</p>
                  </div>
                </div>
             </div>
          </div>
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/20">
              Zero-Friction Engagement
            </div>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Automated WhatsApp CRM & Re-engagement
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Why settle for emails that get ignored? Deliver vouchers, OTPs, and bonus spin notifications directly to WhatsApp. 98% open rates guaranteed.
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {[
                { icon: Zap, text: "Instant Voucher Delivery" },
                { icon: ShieldCheck, text: "Secure OTP Verification" },
                { icon: Users, text: "Viral Referral Alerts" },
                { icon: TrendingUp, text: "Automated Respin Alerts" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <item.icon className="text-emerald-500 w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-slate-300 text-sm">{item.text}</span>
                </div>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Integration Section */}
      <section className="bg-slate-50 py-24 rounded-[4rem] mx-6">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-500/20">
              Omnichannel Integration
            </div>
            <h2 className="text-3xl md:text-6xl font-bold text-slate-900 leading-tight">
              Bridge the Physical-Digital Gap
            </h2>
            <p className="text-lg text-slate-600">
              Turn your physical storefront into a lead generation machine with QR standees, or embed games on your site with one line of code.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 text-left">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <QrCode className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">QR Codes for Standees</h3>
                <p className="text-slate-600 leading-relaxed">
                  Generate print-ready, high-resolution QR codes to place on table standees, packaging, or posters. Turn foot traffic into instant digital leads.
                </p>
              </div>
              <button className="flex items-center gap-2 text-blue-600 font-bold group/btn">
                Download templates <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 group hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                <Code2 className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-900">1-Minute Website Embedding</h3>
                <p className="text-slate-600 leading-relaxed">
                  Embed your games on any website with a single line of code. Automatically inherits your site's styles for a seamless brand experience.
                </p>
              </div>
              <button className="flex items-center gap-2 text-indigo-600 font-bold group/btn">
                Copy embed script <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
