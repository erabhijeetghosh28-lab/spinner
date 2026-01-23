'use client';

export default function Template4Newsletter() {
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        alert('Newsletter subscription coming soon!');
    };

    return (
        <section className="w-full py-24 px-6 bg-template4-mint dark:bg-background-dark relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <span className="material-symbols-outlined !text-[200px] text-template4-primary">eco</span>
            </div>
            <div className="max-w-[800px] mx-auto text-center flex flex-col gap-8 relative z-10">
                <h2 className="text-template4-primary dark:text-white text-4xl font-black">Join the Wellness Movement</h2>
                <p className="text-[#6B7C75] dark:text-gray-400 text-lg">Be the first to explore our upcoming seasonal campaigns and exclusive member rewards.</p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 w-full">
                    <input className="flex-1 h-16 rounded-xl px-6 border-2 border-template4-primary/10 focus:ring-2 focus:ring-template4-primary focus:border-transparent bg-white text-template4-primary placeholder-gray-400" placeholder="Enter your email" type="email" required />
                    <button type="submit" className="h-16 px-10 rounded-xl bg-template4-accent text-white font-bold hover:bg-opacity-90 transition-colors shadow-lg">
                        Join the Community
                    </button>
                </form>
                <p className="text-[10px] text-[#6B7C75] uppercase font-bold tracking-widest">Proudly Sustainable • Carbon Neutral • Ethically Sourced</p>
            </div>
        </section>
    );
}
