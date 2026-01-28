
interface RedemptionTimeProps {
    data: Record<string, number>; // { '1h': x, '24h': y ... }
}

export function RedemptionTimeChart({ data }: RedemptionTimeProps) {
    const total = Object.values(data).reduce((a, b) => a + b, 0);

    const buckets = [
        { key: '1h', label: '< 1 Hour', color: 'bg-green-500' },
        { key: '24h', label: 'Same Day', color: 'bg-emerald-600' },
        { key: '3d', label: '1-3 Days', color: 'bg-teal-700' },
        { key: '1w', label: '1 Week', color: 'bg-cyan-800' },
        { key: '1w+', label: '> 1 Week', color: 'bg-slate-700' },
    ];

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold mb-1">Time-to-Redeem Analysis</h3>
                <p className="text-xs text-slate-500 mb-6">How quickly do users verify their prize? Measures Urgency.</p>
                
                <div className="flex h-4 w-full rounded-full overflow-hidden mb-6 bg-slate-800">
                    {buckets.map(b => {
                        const count = data[b.key] || 0;
                        const pct = total > 0 ? (count / total) * 100 : 0;
                        if (pct === 0) return null;
                        return (
                            <div 
                                key={b.key} 
                                className={`${b.color} hover:contrast-125 transition-all`} 
                                style={{ width: `${pct}%` }} 
                                title={`${b.label}: ${count}`}
                            />
                        );
                    })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {buckets.map(b => {
                        const count = data[b.key] || 0;
                        const pct = total > 0 ? ((count / total) * 100).toFixed(0) : '0';
                        return (
                            <div key={b.key} className="flex items-center justify-between text-xs">
                                <div className="flex items-center">
                                    <div className={`w-2.5 h-2.5 rounded-sm mr-2 ${b.color}`}></div>
                                    <span className="text-slate-300">{b.label}</span>
                                </div>
                                <span className="font-bold text-slate-500">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-center">
                 <p className="text-xs text-slate-400">
                    Calculated from the time of Win to the time of Verification Scan.
                 </p>
            </div>
        </div>
    );
}
