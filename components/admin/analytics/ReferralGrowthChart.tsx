
interface ReferralGrowthProps {
    data: Array<{ date: string; organic: number; referred: number }>;
    viralCoefficient: number;
}

export function ReferralGrowthChart({ data, viralCoefficient }: ReferralGrowthProps) {
    const maxVal = Math.max(...data.map(d => d.organic + d.referred), 1);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold mb-1">Total User Growth</h3>
                    <p className="text-xs text-slate-500">Breakdown of Organic leads vs. Referral viral leads.</p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
                        {viralCoefficient}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Viral Coefficient</div>
                    <div className="text-[9px] text-slate-600">Target {'>'} 1.0</div>
                </div>
            </div>

            <div className="h-64 flex items-end space-x-1">
                {data.map((item, i) => {
                    const total = item.organic + item.referred;
                    const organicHeight = (item.organic / maxVal) * 100;
                    const referredHeight = (item.referred / maxVal) * 100;

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end group h-full relative min-w-[4px]">
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 bg-black border border-slate-700 p-2 rounded-lg z-20 hidden group-hover:block transition-all">
                                <div className="text-[10px] text-slate-400 text-center mb-1">{item.date}</div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-blue-500">Organic</span>
                                    <span>{item.organic}</span>
                                </div>
                                <div className="flex justify-between text-xs font-bold">
                                    <span className="text-pink-500">Referred</span>
                                    <span>{item.referred}</span>
                                </div>
                            </div>
                            
                            {/* Bars */}
                            <div 
                                className="w-full bg-pink-500 rounded-t-sm bg-gradient-to-b from-pink-500 to-pink-600 opacity-90 group-hover:opacity-100 transition-opacity"
                                style={{ height: `${referredHeight}%` }}
                            ></div>
                            <div 
                                className="w-full bg-blue-500/40 rounded-b-sm border-t border-slate-900"
                                style={{ height: `${organicHeight}%` }}
                            ></div>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-between mt-2 text-[10px] text-slate-500 border-t border-slate-800 pt-2">
                <div>{data[0]?.date}</div>
                <div className="flex space-x-4">
                    <div className="flex items-center"><div className="w-2 h-2 bg-pink-500 rounded-full mr-1.5"></div> Referral</div>
                    <div className="flex items-center"><div className="w-2 h-2 bg-blue-500/40 rounded-full mr-1.5"></div> Organic</div>
                </div>
                <div>{data[data.length - 1]?.date}</div>
            </div>
        </div>
    );
}
