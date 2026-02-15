'use client';

import { motion } from 'framer-motion';
import { Check, HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

const categories = [
  {
    name: "Campaigns & Engagement",
    features: [
      { name: "Active Campaigns", starter: "5", pro: "Unlimited", enterprise: "Unlimited + Custom" },
      { name: "Monthly Spins", starter: "5,000", pro: "50,000", enterprise: "Unlimited" },
      { name: "WhatsApp Messages/mo", starter: "2,000", pro: "20,000", enterprise: "Custom Quota" },
      { name: "Social Task Engine", starter: false, pro: "4 Platforms", enterprise: "Full + Custom" },
      { name: "Branded QR Posters", starter: false, pro: true, enterprise: "White-label API" }
    ]
  },
  {
    name: "Analytics & Data",
    features: [
      { name: "Real-time Dashboard", starter: "Basic", pro: "Advanced", enterprise: "Real-time + API" },
      { name: "Data Retention", starter: "90 Days", pro: "1 Year", enterprise: "Unlimited" },
      { name: "Export Formats", starter: "CSV", pro: "CSV / JSON", enterprise: "Custom ETL" },
      { name: "LTV Tracking", starter: false, pro: true, enterprise: "Predictive AI" },
      { name: "Multi-tenant Access", starter: false, pro: false, enterprise: true }
    ]
  },
  {
    name: "Security & Support",
    features: [
      { name: "Anti-Fraud AI", starter: "Basic", pro: "Adaptive", enterprise: "ML + Custom Rules" },
      { name: "Manager Seats", starter: "2", pro: "10", enterprise: "Unlimited" },
      { name: "Support Tier", starter: "Email (24h)", pro: "Priority (4h)", enterprise: "Dedicated Manager" },
      { name: "SLA Guarantee", starter: false, pro: "99.9%", enterprise: "99.99% Core" },
      { name: "Global CDN", starter: true, pro: true, enterprise: "Dedicated Edge" }
    ]
  }
];

export function DetailedFeatureMatrix() {
  const [expanded, setExpanded] = useState(true);

  return (
    <section className="py-24 bg-white" id="feature-matrix">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-slate-900">Compare All Features</h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Get the full picture. See exactly what's included in each plan to power your business growth.
          </p>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl overflow-hidden">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-6 text-left text-sm font-bold text-slate-900 uppercase tracking-wider w-1/3">Features</th>
                <th className="p-6 text-center text-sm font-bold text-slate-900 uppercase tracking-wider">Starter</th>
                <th className="p-6 text-center text-sm font-bold text-slate-900 uppercase tracking-wider bg-blue-50/50">Pro</th>
                <th className="p-6 text-center text-sm font-bold text-slate-900 uppercase tracking-wider">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, ci) => (
                <React.Fragment key={ci}>
                  <tr className="bg-slate-50/50">
                    <td colSpan={4} className="p-4 px-6 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      {cat.name}
                    </td>
                  </tr>
                  {cat.features.map((feature, fi) => (
                    <motion.tr 
                      key={fi}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: fi * 0.05 }}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-700">{feature.name}</span>
                          <HelpCircle className="w-3.5 h-3.5 text-slate-300 cursor-help" />
                        </div>
                      </td>
                      <td className="p-6 text-center text-sm text-slate-600">
                        {renderValue(feature.starter)}
                      </td>
                      <td className="p-6 text-center text-sm text-slate-900 font-semibold bg-blue-50/30">
                        {renderValue(feature.pro)}
                      </td>
                      <td className="p-6 text-center text-sm text-slate-600">
                        {renderValue(feature.enterprise)}
                      </td>
                    </motion.tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          <div className="p-8 bg-slate-50 text-center border-t border-slate-200">
            <p className="text-sm text-slate-500 italic mb-6">
              Prices exclude applicable taxes. WhatsApp message quotas reset monthly.
            </p>
            <button className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg">
              Start Free Trial
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function renderValue(val: any) {
  if (val === true) return <div className="flex justify-center"><Check className="text-emerald-500 w-5 h-5 bg-emerald-50 rounded-full p-0.5" /></div>;
  if (val === false) return <div className="flex justify-center"><X className="text-slate-200 w-5 h-5" /></div>;
  return <span>{val}</span>;
}

import React from 'react';
