
interface RetentionProps {
    data: Record<string, number>; // { '1': x, '2-5': y ... }
}

export function RetentionChart({ data }: RetentionProps) {
    const buckets = [
        { key: '1', label: '1 Spin', desc: 'One-time Users', color: 'bg-slate-600' },
        { key: '2-5', label: '2-5 Spins', desc: 'Returning', color: 'bg-blue-500' },
        { key: '5-10', label: '5-10 Spins', desc: 'Loyal', color: 'bg-purple-500' },
        { key: '10+', label: '10+ Spins', desc: 'Super Fans', color: 'bg-amber-500' },
    ];

    const totalUsers = Object.values(data).reduce((a, b) => a + b, 0);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full">
            <h3 className="text-lg font-bold mb-1">User Retention Frequency</h3>
            <p className="text-xs text-slate-500 mb-6">How many times does the average user spin?</p>

            <div className="space-y-4">
                {buckets.map((bucket) => {
                    const count = data[bucket.key] || 0;
                    const percent = totalUsers > 0 ? ((count / totalUsers) * 100).toFixed(1) : '0';

                    return (
                        <div key={bucket.key}>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-bold text-white">{bucket.label} <span className="text-slate-500 font-normal">- {bucket.desc}</span></span>
                                <span className="text-slate-400">{count} users ({percent}%)</span>
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${bucket.color}`} 
                                    style={{ width: `${percent}%` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-slate-800/50 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-slate-300">
                        {totalUsers > 0 ? ((1 - (data['1'] / totalUsers)) * 100).toFixed(0) : 0}%
                    </div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Return Rate</div>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-amber-500">
                        {data['10+'] || 0}
                    </div>
                    <div className="text-[10px] text-amber-500/70 uppercase tracking-wider">Super Fans</div>
                </div>
            </div>
        </div>
    );
}
