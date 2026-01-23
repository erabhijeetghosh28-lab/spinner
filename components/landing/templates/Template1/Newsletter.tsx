'use client';

export default function Template1Newsletter() {
    // Template 1 primary color from reference HTML
    const primaryColor = '#f48c25';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement newsletter subscription
        alert('Newsletter subscription coming soon!');
    };

    return (
        <section 
            className="w-full py-20 px-6"
            style={{ backgroundColor: primaryColor }}
        >
            <div className="max-w-[800px] mx-auto text-center flex flex-col gap-6">
                <h2 className="text-white text-4xl font-black">Join the Brand Revolution</h2>
                <p className="text-white/80 text-lg">Be the first to hear about our next campaign and exclusive product highlights.</p>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
                    <input 
                        className="flex-1 h-14 rounded-xl px-6 border-none focus:ring-2 focus:ring-white/50 text-black placeholder-gray-500" 
                        placeholder="Enter your email" 
                        type="email"
                        required
                    />
                    <button 
                        type="submit"
                        className="h-14 px-10 rounded-xl bg-[#1e293b] text-white font-bold hover:bg-[#334155] transition-colors shadow-xl"
                    >
                        Get Early Access
                    </button>
                </form>
            </div>
        </section>
    );
}
