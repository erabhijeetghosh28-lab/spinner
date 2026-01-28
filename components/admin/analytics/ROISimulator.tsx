import { useEffect, useState } from 'react';

interface ROIData {
    totalUsers: number;
    totalRedemptions: number;
    totalSpins: number;
}

export function ROISimulator({ data }: { data: ROIData }) {
    const [avgOrderValue, setAvgOrderValue] = useState(25); // Default $25
    const [avgPrizeCost, setAvgPrizeCost] = useState(2);    // Default $2
    const [profit, setProfit] = useState(0);
    const [roi, setRoi] = useState(0);

    useEffect(() => {
        // Revenue = Confirmed Users * Avg Order Value (assuming redemptions = confirmed sales)
        // Ideally this matches 'redeemed' vouchers which imply a sale
        const revenue = data.totalRedemptions * avgOrderValue;
        
        // Cost = Total Redemptions * Prize Cost (assuming you only pay when redeemed)
        // OR Cost = Total Spins * Cost? Usually prize cost is incurred on redemption for digital goods, 
        // but let's assume worst case: Cost = Redemption * PrizeCost.
        // If it's pure cost per redemption:
        const cost = data.totalRedemptions * avgPrizeCost;
        
        const netProfit = revenue - cost;
        const roiVal = cost > 0 ? (netProfit / cost) * 100 : 0;
        
        setProfit(netProfit);
        setRoi(roiVal);
    }, [avgOrderValue, avgPrizeCost, data]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-40 bg-green-500/5 blur-[100px] rounded-full pointer-events-none"></div>
             
             <div className="flex justify-between items-start mb-8 relative z-10">
                <div>
                    <h3 className="text-lg font-bold mb-1 text-green-400">ROI Simulator</h3>
                    <p className="text-xs text-slate-500">Model your campaign profitability based on real redemption data.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 relative z-10">
                {/* Inputs */}
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Avg. Sales Value per Redemption (₹)</label>
                        <input 
                            type="range" 
                            min="1" max="10000" 
                            value={avgOrderValue} 
                            onChange={e => setAvgOrderValue(parseInt(e.target.value))}
                            className="w-full accent-green-500 mb-2"
                        />
                        <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                             <span className="text-xs text-slate-500">Order Value</span>
                             <span className="font-mono font-bold text-white text-lg">₹{avgOrderValue}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase">Avg. Cost per Prize (₹)</label>
                         <input 
                            type="range" 
                            min="0" max="2000" 
                            value={avgPrizeCost} 
                            onChange={e => setAvgPrizeCost(parseInt(e.target.value))}
                            className="w-full accent-red-500 mb-2"
                        />
                        <div className="flex justify-between items-center bg-slate-800 p-3 rounded-lg border border-slate-700">
                             <span className="text-xs text-slate-500">Prize Cost</span>
                             <span className="font-mono font-bold text-white text-lg">₹{avgPrizeCost}</span>
                        </div>
                    </div>
                </div>

                {/* Results Output */}
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 flex flex-col justify-center text-center">
                    <div className="mb-6">
                        <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Estimated Net Profit</div>
                        <div className={`text-4xl font-black ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            ₹{profit.toLocaleString()}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4">
                        <div>
                             <div className="text-[10px] text-slate-500 uppercase">ROI Multiplier</div>
                             <div className={`text-xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                 {roi > 0 ? '+' : ''}{roi.toFixed(0)}%
                             </div>
                        </div>
                         <div>
                             <div className="text-[10px] text-slate-500 uppercase">Total Sales Volume</div>
                             <div className="text-xl font-bold text-white">
                                 ₹{(data.totalRedemptions * avgOrderValue).toLocaleString()}
                             </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                Based on {data.totalRedemptions} actual redemptions recorded in the system.
            </div>
        </div>
    );
}
