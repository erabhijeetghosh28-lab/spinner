'use client';

export default function Template2Newsletter() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Newsletter subscription coming soon!');
    };

    return (
        <section className="w-full py-20 px-6">
            <div className="max-w-[800px] mx-auto glass-panel p-10 rounded-[2rem] text-center flex flex-col gap-6 shadow-2xl border-template2-primary/20">
                <h2 className="text-white text-4xl font-black tracking-tight">Join the Tech Revolution</h2>
                <p className="text-gray-400 text-lg">Be the first to hear about our next high-tech campaign and exclusive product highlights.</p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                    <input className="flex-1 h-14 rounded-xl px-6 bg-template2-navy-dark border-white/10 focus:ring-2 focus:ring-template2-primary focus:border-transparent text-white placeholder-gray-500" placeholder="Enter your business email" type="email" required />
                    <button type="submit" className="h-14 px-10 rounded-xl bg-template2-primary text-template2-navy-dark font-extrabold hover:brightness-110 transition-all shadow-[0_0_15px_rgba(0,242,255,0.3)]">
                        GET EARLY ACCESS
                    </button>
                </form>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Limited slots available for the alpha phase</p>
            </div>
        </section>
    );
}
