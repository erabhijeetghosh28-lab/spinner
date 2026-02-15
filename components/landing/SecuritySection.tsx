'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Database, Fingerprint, Lock, ShieldAlert } from 'lucide-react';

const compliance = [
  {
    icon: ShieldAlert,
    title: "GDPR Compliant",
    desc: "Full data portability, right to be forgotten, and PII masking built into the core engine.",
    color: "text-blue-600",
    bg: "bg-blue-50"
  },
  {
    icon: Lock,
    title: "SOC 2 Type II",
    desc: "Rigorous annual third-party audits for security, availability, and confidentiality.",
    color: "text-purple-600",
    bg: "bg-purple-50"
  },
  {
    icon: Fingerprint,
    title: "2FA & Audit Logs",
    desc: "Every manager action is logged with an immutable audit trail. Mandatory 2FA for admins.",
    color: "text-emerald-600",
    bg: "bg-emerald-50"
  },
  {
    icon: Database,
    title: "Daily Backups",
    desc: "AES-256 encrypted backups stored across multiple geographic regions with 99.999% durability.",
    color: "text-amber-600",
    bg: "bg-amber-50"
  }
];

const technicalSpecs = [
  { label: "Data Encryption", value: "AES-256-GCM / TLS 1.3" },
  { label: "Storage Architecture", value: "Encrypted Multi-tenant" },
  { label: "API Throttling", value: "10k req/min per Tenant" },
  { label: "Uptime SLA", value: "99.99% Guaranteed" },
  { label: "Cloud Infrastructure", value: "Globally Distributed Edge" },
  { label: "Security Scanning", value: "Daily Static/Dynamic Analysis" }
];

export function SecuritySection() {
  return (
    <section className="py-24 bg-slate-50 overflow-hidden" id="security">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-5 gap-16 items-center">
          {/* Left Content - Badges */}
          <div className="lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider border border-emerald-200 mb-6">
                Enterprise Reliability
              </span>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
                Security by Design
              </h2>
              <p className="text-xl text-slate-600 leading-relaxed">
                We protect your customer data with industrial-grade encryption and rigorous compliance standards.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              {compliance.map((item, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className={`w-12 h-12 rounded-xl ${item.bg} flex items-center justify-center mb-4`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Content - Tech Specs */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden"
          >
            {/* Terminal Decoration */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />
            
            <div className="flex items-center gap-2 mb-8 opacity-50">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono ml-2">security_manifest.json</span>
            </div>

            <div className="space-y-6">
              {technicalSpecs.map((spec, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-xs font-mono text-emerald-400"># {spec.label}</span>
                  <div className="flex items-center justify-between font-mono bg-white/5 p-3 rounded-lg border border-white/10 hover:border-emerald-500/50 transition-colors">
                    <span className="text-sm truncate mr-2 italic">leadspin_v1.08 /</span>
                    <span className="text-sm font-bold text-white">{spec.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-medium">All systems operational & secure</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
