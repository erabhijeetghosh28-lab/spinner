
interface PrizeIntegrityProps {
    data: Array<{
        name: string;
        probability: number;
        actualWinCount: number;
        actualWinRate: string | number;
    }>;
}

export function PrizeIntegrityChart({ data }: PrizeIntegrityProps) {
    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-1">Prize Integrity Audit</h3>
            <p className="text-xs text-slate-500 mb-6">Configured Probability vs. Actual Win Rate. Ensures fair play.</p>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-500 text-[10px] uppercase tracking-wider border-b border-slate-800">
                            <th className="pb-2 font-bold pl-2">Prize Name</th>
                            <th className="pb-2 font-bold">Configured %</th>
                            <th className="pb-2 font-bold">Actual %</th>
                            <th className="pb-2 font-bold text-right pr-2">Total Wins</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {data.map((item, i) => {
                            const actual = Number(item.actualWinRate);
                            // Highlight anomalies (difference > 5%)
                            const diff = actual - item.probability;
                            const isHighAnomaly = diff > 5;
                            const isLowAnomaly = diff < -5;
                            
                            return (
                                <tr key={i} className="hover:bg-slate-800/30 transition-colors text-xs">
                                    <td className="py-3 pl-2 font-medium text-slate-300 truncate max-w-[120px]" title={item.name}>
                                        {item.name}
                                    </td>
                                    <td className="py-3 text-slate-400 font-mono">
                                        {item.probability.toFixed(1)}%
                                    </td>
                                    <td className="py-3 font-mono font-bold">
                                        <div className="flex items-center space-x-2">
                                            <span className={`${isHighAnomaly ? 'text-red-400' : isLowAnomaly ? 'text-blue-400' : 'text-green-400'}`}>
                                                {actual.toFixed(1)}%
                                            </span>
                                            {isHighAnomaly && <span className="text-[10px] text-red-500 px-1 border border-red-500/30 rounded">HIGH</span>}
                                        </div>
                                    </td>
                                    <td className="py-3 text-right pr-2 text-slate-300">
                                        {item.actualWinCount}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {data.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic text-sm">No win data available yet.</div>
            )}
        </div>
    );
}
