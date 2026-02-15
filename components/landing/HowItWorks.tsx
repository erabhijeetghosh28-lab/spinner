'use client';

export function HowItWorks() {
    const steps = [
        { icon: '🎨', title: '1. Brand Alignment', desc: 'Configure your wheel and reward logic in 5 minutes using our high-conversion templates.' },
        { icon: '🛰️', title: '2. Deploy Everywhere', desc: 'Launch via custom QR standees or embed as a high-intent popup on your website.' },
        { icon: '💸', title: '3. Drive Conversions', desc: 'Customers spin and win uniquely generated, non-replicable WhatsApp vouchers.' },
        { icon: '📈', title: '4. Scale with Data', desc: 'Validate rewards at counter and watch your growth metrics climb in real-time.' },
    ];

    return (
        <section className="py-28 bg-gradient-to-br from-slate-900 to-slate-800 text-white overflow-hidden relative" id="how-it-works">
            <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2760%27%20height%3D%2760%27%20viewBox%3D%270%200%2060%2060%27%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%3E%3Cg%20fill%3D%27none%27%20fill-rule%3D%27evenodd%27%3E%3Cg%20fill%3D%27%23ffffff%27%20fill-opacity%3D%271%27%3E%3Cpath%20d%3D%27M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%27%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-24">
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider border border-cyan-500/30 mb-6">
                        Complete Workflow
                    </span>
                    <h2 className="text-4xl md:text-6xl font-bold mb-6">The Journey to ROI</h2>
                    <p className="text-xl text-gray-300 max-w-2xl mx-auto">A seamless experience for both business owners and their customers.</p>
                </div>
                
                <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {steps.map((step, i) => (
                        <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                            <div className="size-24 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-cyan-500/50 flex items-center justify-center text-5xl mb-8 shadow-2xl shadow-cyan-500/20 transition-all duration-300 group-hover:scale-110 group-hover:border-cyan-500 group-hover:shadow-cyan-500/40">
                                {step.icon}
                            </div>
                            <div className="bg-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-widest">Step {i + 1}</div>
                            <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
