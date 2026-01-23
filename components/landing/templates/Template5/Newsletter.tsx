'use client';

export default function Template5Newsletter() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Newsletter subscription coming soon!');
    };

    return (
        <section className="w-full py-24 px-6 bg-black text-white">
            <div className="max-w-[1000px] mx-auto text-center flex flex-col gap-10">
                <div className="flex flex-col gap-4">
                    <span className="text-template5-primary font-black uppercase tracking-[0.4em] text-xs">Stay in the Loop</span>
                    <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter">Join the Revolution</h2>
                </div>
                <p className="text-gray-400 text-xl max-w-[700px] mx-auto">Be the first to hear about our next high-stakes campaign and exclusive product highlights.</p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 w-full max-w-[700px] mx-auto border-2 border-white/10 p-2">
                    <input className="flex-1 h-16 bg-transparent border-none focus:ring-0 text-white placeholder-gray-600 text-lg px-6" placeholder="Enter your business email" type="email" required />
                    <button type="submit" className="h-16 px-12 bg-template5-primary text-white font-black uppercase tracking-widest hover:bg-white hover:text-black transition-colors">
                        Get Access
                    </button>
                </form>
            </div>
        </section>
    );
}
