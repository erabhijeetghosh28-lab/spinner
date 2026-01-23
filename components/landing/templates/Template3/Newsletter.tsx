'use client';

export default function Template3Newsletter() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Newsletter subscription coming soon!');
    };

    return (
        <section className="w-full py-24 px-6 bg-[#1A1612] relative overflow-hidden">
            <div className="max-w-[850px] mx-auto text-center flex flex-col gap-8 relative z-10">
                <span className="text-template3-primary font-bold uppercase tracking-[0.4em] text-xs">Join the Elite</span>
                <h2 className="text-white text-4xl md:text-5xl font-serif font-bold">The Inner Circle</h2>
                <p className="text-white/60 text-lg font-light tracking-wide max-w-[600px] mx-auto">Subscribe to receive exclusive access to our next luxury campaign and private product reveals.</p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 w-full shadow-2xl">
                    <input className="flex-1 h-16 bg-white/5 border border-white/10 px-8 focus:ring-1 focus:ring-template3-primary focus:border-template3-primary text-white placeholder-white/30 text-sm font-light uppercase tracking-widest" placeholder="Your Distinguished Email" type="email" required />
                    <button type="submit" className="h-16 px-12 gold-shimmer text-white font-bold uppercase tracking-[0.2em] text-xs hover:brightness-110 transition-all">
                        Request Invite
                    </button>
                </form>
            </div>
        </section>
    );
}
