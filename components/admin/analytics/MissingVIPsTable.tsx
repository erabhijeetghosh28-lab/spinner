
interface ChurnCandidate {
    name: string;
    phone: string;
    totalSpins: number;
    lastActive: string; // ISO date
}

export function MissingVIPsTable({ data }: { data: ChurnCandidate[] }) {
    const generateMessage = (name: string) => {
        const text = `Hi ${name}! We noticed you haven't spun the wheel in a while. Here is a special invitation to come back and win! 🎁`;
        return encodeURIComponent(text);
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-lg font-bold mb-1 text-red-400">The "Missing VIP" Finder</h3>
                    <p className="text-xs text-slate-500">High-value users ({'>'}5 spins) who haven't visited in 7+ days.</p>
                </div>
                <div className="bg-red-500/10 text-red-500 px-3 py-1 rounded-lg text-xs font-bold border border-red-500/20">
                    {data.length} At Risk
                </div>
            </div>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-900 z-10">
                        <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                            <th className="pb-3 font-bold">User</th>
                            <th className="pb-3 font-bold">Total Spins</th>
                            <th className="pb-3 font-bold">Last Active</th>
                            <th className="pb-3 font-bold text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.map((user, i) => (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                                <td className="py-4 font-bold text-sm text-white">
                                    {user.name}
                                    <div className="text-[10px] text-slate-500 font-normal">{user.phone}</div>
                                </td>
                                <td className="py-4">
                                    <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded text-xs font-bold border border-amber-500/30">
                                        {user.totalSpins}
                                    </span>
                                </td>
                                <td className="py-4 text-xs text-slate-400">
                                    {new Date(user.lastActive).toLocaleDateString()}
                                </td>
                                <td className="py-4 text-right">
                                    <a 
                                        href={`https://wa.me/${user.phone}?text=${generateMessage(user.name)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-1 bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <span>💬 Re-engage</span>
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                    No churn risks detected! Your users are loyal. 🚀
                </div>
            )}
        </div>
    );
}
