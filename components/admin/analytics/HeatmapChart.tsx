
interface HeatmapProps {
    data: Record<number, Record<number, number>>; // { day: { hour: count } }
}

export function HeatmapChart({ data }: HeatmapProps) {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Find max value for normalization
    let max = 0;
    Object.values(data).forEach(dayData => {
        Object.values(dayData).forEach(count => {
            if (count > max) max = count;
        });
    });

    const getIntensity = (count: number) => {
        if (count === 0) return 'bg-slate-800';
        const ratio = count / (max || 1);
        if (ratio < 0.25) return 'bg-amber-500/20';
        if (ratio < 0.5) return 'bg-amber-500/40';
        if (ratio < 0.75) return 'bg-amber-500/70';
        return 'bg-amber-500';
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-1">Peak Activity Heatmap</h3>
            <p className="text-xs text-slate-500 mb-6">Darker colors indicate higher spin volume. Identify your "Golden Hours".</p>
            
            <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                    <div className="flex mb-2">
                        <div className="w-12"></div>
                        {hours.map(h => (
                            <div key={h} className="flex-1 text-[10px] text-center text-slate-500 font-mono">
                                {h % 3 === 0 ? `${h}h` : ''}
                            </div>
                        ))}
                    </div>
                    {days.map((day, dIdx) => (
                        <div key={day} className="flex mb-1.5 h-6">
                            <div className="w-12 text-xs font-semibold text-slate-400 flex items-center">{day}</div>
                            {hours.map(h => {
                                const count = data[dIdx]?.[h] || 0;
                                return (
                                    <div 
                                        key={h} 
                                        className={`flex-1 mx-[1px] rounded-sm transition-all hover:ring-1 ring-white/20 relative group ${getIntensity(count)}`}
                                    >
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-black text-white text-[10px] px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10 border border-slate-700">
                                            {day} {h}:00 - {count} spins
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="flex items-center justify-end mt-4 text-[10px] text-slate-500 space-x-4">
                <div className="flex items-center"><div className="w-3 h-3 bg-slate-800 rounded mr-1.5 border border-slate-700"></div> No Activity</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-amber-500/20 rounded mr-1.5"></div> Low</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-amber-500/60 rounded mr-1.5"></div> Medium</div>
                <div className="flex items-center"><div className="w-3 h-3 bg-amber-500 rounded mr-1.5"></div> High</div>
            </div>
        </div>
    );
}
