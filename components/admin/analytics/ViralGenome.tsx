import { useState } from 'react';

interface GenomeNode {
    name: string;
    totalReferrals: number;
    children: Array<{
        name: string;
        ownReferrals: number;
    }>;
}

export function ViralGenome({ data }: { data: GenomeNode[] }) {
    const [selectedNode, setSelectedNode] = useState<number | null>(null);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 p-32 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className="text-lg font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">The Viral Genome</h3>
                    <p className="text-xs text-slate-500">Mapping your top "Super Connectors" and their impact chains.</p>
                </div>
                <div className="bg-purple-500/10 border border-purple-500/30 text-purple-400 px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    Beta
                </div>
            </div>

            <div className="relative min-h-[300px] flex items-center justify-center">
                {/* Central "You" Node */}
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                    <div className="w-16 h-16 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center shadow-2xl relative">
                        <span className="text-2xl">👑</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500 mt-2">Campaign</span>
                </div>

                {/* Connection Lines Layer would go here if using SVG/Canvas, keeping it simple CSS for now */}
                
                {/* Connector Nodes */}
                <div className="flex flex-col space-y-4 ml-24 w-full max-w-md">
                    {data.map((node, i) => (
                        <div 
                            key={i} 
                            className={`transition-all duration-300 transform cursor-pointer ${selectedNode === i ? 'scale-105' : 'hover:scale-102 opacity-90'}`}
                            onClick={() => setSelectedNode(selectedNode === i ? null : i)}
                        >
                            <div className={`p-3 rounded-xl border ${selectedNode === i ? 'bg-purple-900/30 border-purple-500' : 'bg-slate-800 border-slate-700 hover:border-slate-600'} flex items-center justify-between shadow-lg`}>
                                <div className="flex items-center space-x-3">
                                    <div className="relative">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">
                                            {node.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-slate-900 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full border border-slate-700">
                                            {i + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{node.name}</div>
                                        <div className="text-[10px] text-purple-400">{node.totalReferrals} verified referrals</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                     <div className="text-xs font-mono text-slate-500">Impact Score</div>
                                     <div className="text-lg font-black text-white">{node.totalReferrals * 10 + node.children.reduce((a,b) => a + b.ownReferrals, 0) * 5}</div>
                                </div>
                            </div>
                            
                            {/* Children (Network) */}
                            {selectedNode === i && (
                                <div className="ml-8 mt-2 pl-4 border-l-2 border-purple-500/20 space-y-2 animate-fadeIn">
                                    {node.children.length > 0 ? node.children.slice(0, 3).map((child, j) => (
                                        <div key={j} className="flex items-center justify-between text-xs bg-slate-800/50 p-2 rounded">
                                            <span className="text-slate-300">↳ {child.name}</span>
                                            <span className="text-slate-500">Referrers: {child.ownReferrals}</span>
                                        </div>
                                    )) : (
                                        <div className="text-[10px] text-slate-500 italic p-2">End of viral chain</div>
                                    )}
                                    {node.children.length > 3 && (
                                        <div className="text-[10px] text-purple-400 pl-2">
                                            + {node.children.length - 3} more connections...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {data.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No viral trends detected yet. Share your campaign!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
