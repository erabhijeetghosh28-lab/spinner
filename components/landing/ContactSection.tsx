'use client';

export function ContactSection() {
    return (
        <section id="contact" className="py-24 bg-white overflow-hidden relative">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-cyan-50 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-50 rounded-full blur-3xl opacity-50" />

            <div className="max-w-7xl mx-auto px-6 relative">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">Get in Touch</h2>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Have questions or need a custom solution? Our team is here to help you scale your engagement.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* WhatsApp */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-green-500/30 transition-all duration-300 group">
                        <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-4 text-slate-900">WhatsApp</h4>
                        <div className="space-y-2">
                            <a href="https://wa.me/918076074179" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-600 hover:text-green-600 transition-colors">+91 80760 74179</a>
                            <a href="https://wa.me/918638310045" target="_blank" rel="noopener noreferrer" className="block text-sm text-slate-600 hover:text-green-600 transition-colors">+91 86383 10045</a>
                        </div>
                    </div>

                    {/* Email */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-cyan-500/30 transition-all duration-300 group">
                        <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-4 text-slate-900">Email Us</h4>
                        <a href="mailto:raju@clickgenieinfo.com" className="text-sm text-slate-600 hover:text-cyan-600 transition-colors">raju@clickgenieinfo.com</a>
                    </div>

                    {/* Website */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-indigo-500/30 transition-all duration-300 group">
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-4 text-slate-900">Official Site</h4>
                        <a href="https://www.clickgenieinfo.com/" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">clickgenieinfo.com</a>
                    </div>

                    {/* Business Info / GSTN */}
                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:border-amber-500/30 transition-all duration-300 group">
                        <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h4 className="font-bold text-lg mb-4 text-slate-900">Registration</h4>
                        <div className="bg-slate-200 px-3 py-1 rounded-lg text-xs font-mono text-slate-700">
                            07AAVFC2134L1Z5
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
