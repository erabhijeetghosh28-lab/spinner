
interface FunnelData {
    spins: number; // Impressions/Attempts
    wins: number;  // Generated a prize
    vouchers: number; // Created voucher (should match wins mostly)
    redeemed: number; // Used voucher
}

export function RedemptionFunnel({ data }: { data: FunnelData }) {
    const steps = [
        { label: 'Total Spins', value: data.spins, color: 'bg-blue-900', textColor: 'text-blue-200' },
        { label: 'Prizes Won', value: data.wins, color: 'bg-indigo-700', textColor: 'text-indigo-200' },
        { label: 'Vouchers Verified', value: data.vouchers, color: 'bg-purple-600', textColor: 'text-purple-100' },
        { label: 'Prizes Redeemed', value: data.redeemed, color: 'bg-pink-500', textColor: 'text-white' },
    ];

    const maxVal = data.spins || 1;

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-full flex flex-col justify-between">
            <div>
                <h3 className="text-lg font-bold mb-1">Conversion Funnel</h3>
                <p className="text-xs text-slate-500 mb-6">Track the journey from a Spin to a Redeemed Prize.</p>
            </div>

            <div className="space-y-3 relative">
                {/* Connecting Line */}
                <div className="absolute top-4 bottom-4 left-[50%] w-0.5 bg-slate-800/50 -z-10 transform -translate-x-1/2"></div>
                
                {steps.map((step, i) => {
                    const widthPercent = Math.max((step.value / maxVal) * 100, 15); // Min 15% width for visibility
                    const dropOff = i > 0 ? Math.round(((steps[i-1].value - step.value) / steps[i-1].value) * 100) : 0;
                    const conversion = i > 0 ? 100 - (Number.isNaN(dropOff) ? 0 : dropOff) : 100;

                    return (
                        <div key={i} className="relative group">
                            <div className="flex items-center justify-center mb-1">
                                <div 
                                    className={`${step.color} h-12 rounded-lg flex items-center justify-between px-4 transition-all duration-500 shadow-lg`}
                                    style={{ width: `${widthPercent}%`, minWidth: '200px' }}
                                >
                                    <span className={`text-xs font-bold ${step.textColor} uppercase tracking-wider whitespace-nowrap`}>
                                        {step.label}
                                    </span>
                                    <span className={`text-lg font-black ${step.textColor}`}>
                                        {step.value.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            
                            {i > 0 && (
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500 bg-slate-900 px-1 border border-slate-800 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {conversion}% cont.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 bg-slate-800/50 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-400">
                    Funnel Efficiency: <span className="text-pink-400 font-bold">{data.wins > 0 ? ((data.redeemed / data.wins) * 100).toFixed(1) : 0}%</span> of winners redeem their prize
                </p>
            </div>
        </div>
    );
}
