import ImageUploadButton from '@/components/ImageUploadButton';

interface Prize {
    id?: string;
    imageUrl?: string;
    name: string;
    couponCode?: string;
    probability: number;
    dailyLimit: number;
    currentStock?: number | null;
    lowStockAlert?: number | null;
    isActive: boolean;
    showTryAgainMessage?: boolean;
    voucherValidityDays?: number;
    voucherRedemptionLimit?: number;
    sendQRCode?: boolean;
    position: number;
    colorCode: string;
}

interface PrizeTableProps {
    prizes: Prize[];
    onUpdate: (idx: number, field: string, value: any) => void;
    onAdd: () => void;
    onDelete: (idx: number, id?: string) => void;
    allowInventoryTracking?: boolean;
    campaignId?: string | null;
    errors?: Record<number, { name?: string; couponCode?: string }>;
}

export function PrizeTable({
    prizes,
    onUpdate,
    onAdd,
    onDelete,
    allowInventoryTracking,
    campaignId,
    errors
}: PrizeTableProps) {
    return (
        <>
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Wheel segments & Offers</h2>
                    <p className="text-slate-400 text-sm">Configure up to 10 prizes for the wheel</p>
                </div>
                <button
                    type="button"
                    onClick={onAdd}
                    disabled={prizes.length >= 10}
                    className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 px-6 py-2 rounded-xl text-sm font-bold border border-amber-500/50 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                    <span>+ Add Offer</span>
                </button>
            </div>

            <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-slate-400 text-xs uppercase tracking-wider border-b-2 border-slate-700">
                            <th className="pb-5 pt-2 px-4 font-bold text-left">Image</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[180px]">Offer Name</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[140px]">Coupon Code</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Prob (%)</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[120px]">Daily Limit</th>
                            {allowInventoryTracking && (
                                <>
                                    <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Stock</th>
                                    <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Low Alert</th>
                                </>
                            )}
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">Status</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[120px]">Try Again</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[120px]">Voucher Days</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[120px]">Redeem Limit</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-left min-w-[100px]">QR Code</th>
                            <th className="pb-5 pt-2 px-4 font-bold text-right min-w-[80px]">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                        {prizes && prizes.length > 0 ? (
                            prizes.map((prize, idx) => (
                                <tr key={prize.id || idx} className="group hover:bg-slate-800/40 transition-colors">
                                    <td className="py-6 px-4">
                                        <ImageUploadButton
                                            currentImageUrl={prize.imageUrl}
                                            onUploadComplete={(url) => onUpdate(idx, 'imageUrl', url)}
                                            onUploadError={(error) => {
                                                console.error('Image upload failed:', error);
                                            }}
                                        />
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="text"
                                            value={prize.name}
                                            onChange={(e) => onUpdate(idx, 'name', e.target.value)}
                                            className={`bg-transparent border-b-2 ${errors?.[idx]?.name ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-amber-500'} outline-none w-full py-2 text-slate-200 text-sm font-medium transition-colors`}
                                            placeholder="Enter offer name"
                                        />
                                        {errors?.[idx]?.name && (
                                            <div className="text-xs text-red-400 mt-1">{errors[idx].name}</div>
                                        )}
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="text"
                                            value={prize.couponCode || ''}
                                            placeholder="CODE123"
                                            onChange={(e) => onUpdate(idx, 'couponCode', e.target.value)}
                                            className={`bg-transparent border-b-2 ${errors?.[idx]?.couponCode ? 'border-red-500 focus:border-red-400' : 'border-slate-800 focus:border-amber-500'} outline-none w-full py-2 text-slate-200 font-mono text-sm uppercase transition-colors`}
                                        />
                                        {errors?.[idx]?.couponCode && (
                                            <div className="text-xs text-red-400 mt-1">{errors[idx].couponCode}</div>
                                        )}
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="number"
                                                value={prize.probability}
                                                onChange={(e) => onUpdate(idx, 'probability', e.target.value)}
                                                className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-16 py-2 text-slate-200 text-sm font-medium transition-colors"
                                                min="0"
                                                max="100"
                                            />
                                            <span className="text-slate-500 text-sm">%</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="number"
                                            value={prize.dailyLimit}
                                            onChange={(e) => onUpdate(idx, 'dailyLimit', e.target.value)}
                                            className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                            min="0"
                                        />
                                    </td>
                                    {allowInventoryTracking && (
                                        <>
                                            <td className="py-6 px-4">
                                                <input
                                                    type="number"
                                                    value={prize.currentStock ?? ''}
                                                    onChange={(e) => onUpdate(idx, 'currentStock', e.target.value === '' ? null : parseInt(e.target.value))}
                                                    className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                                    placeholder="∞"
                                                    min="0"
                                                />
                                            </td>
                                            <td className="py-6 px-4">
                                                <input
                                                    type="number"
                                                    value={prize.lowStockAlert ?? ''}
                                                    onChange={(e) => onUpdate(idx, 'lowStockAlert', e.target.value === '' ? null : parseInt(e.target.value))}
                                                    className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                                    placeholder="0"
                                                    min="0"
                                                />
                                            </td>
                                        </>
                                    )}
                                    <td className="py-6 px-4">
                                        <button
                                            type="button"
                                            onClick={() => onUpdate(idx, 'isActive', !prize.isActive)}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${prize.isActive ? 'bg-green-500/20 text-green-400 border-2 border-green-500/40 hover:bg-green-500/30' : 'bg-red-500/20 text-red-400 border-2 border-red-500/40 hover:bg-red-500/30'}`}
                                        >
                                            {prize.isActive ? 'Active' : 'Inactive'}
                                        </button>
                                    </td>
                                    <td className="py-6 px-4">
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={prize.showTryAgainMessage || false}
                                                onChange={(e) => onUpdate(idx, 'showTryAgainMessage', e.target.checked)}
                                                className="w-5 h-5 rounded border-2 border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-2 cursor-pointer transition-all"
                                                title="Enable to show 'Sorry, try again in some time' when spinner lands on this prize"
                                            />
                                            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                                {prize.showTryAgainMessage ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="number"
                                            value={prize.voucherValidityDays ?? 30}
                                            onChange={(e) => onUpdate(idx, 'voucherValidityDays', parseInt(e.target.value) || 30)}
                                            className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                            min="1"
                                            max="365"
                                            title="Number of days until voucher expires"
                                        />
                                    </td>
                                    <td className="py-6 px-4">
                                        <input
                                            type="number"
                                            value={prize.voucherRedemptionLimit ?? 1}
                                            onChange={(e) => onUpdate(idx, 'voucherRedemptionLimit', parseInt(e.target.value) || 1)}
                                            className="bg-transparent border-b-2 border-slate-800 focus:border-amber-500 outline-none w-20 py-2 text-slate-200 text-sm font-medium transition-colors"
                                            min="1"
                                            max="10"
                                            title="Maximum number of times voucher can be redeemed"
                                        />
                                    </td>
                                    <td className="py-6 px-4">
                                        <label className="flex items-center space-x-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={prize.sendQRCode ?? true}
                                                onChange={(e) => onUpdate(idx, 'sendQRCode', e.target.checked)}
                                                className="w-5 h-5 rounded border-2 border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500 focus:ring-2 cursor-pointer transition-all"
                                                title="Generate and send QR code with voucher"
                                            />
                                            <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">
                                                {prize.sendQRCode ?? true ? 'Yes' : 'No'}
                                            </span>
                                        </label>
                                    </td>
                                    <td className="py-6 px-4 text-right">
                                        <button
                                            onClick={() => onDelete(idx, prize.id)}
                                            className="p-2.5 text-red-500/60 hover:text-red-400 hover:bg-red-500/15 rounded-lg transition-all group"
                                            title="Delete Offer"
                                            type="button"
                                        >
                                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={allowInventoryTracking ? 13 : 11} className="py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center space-y-2">
                                        <span className="text-4xl text-slate-700">🎁</span>
                                        <span className="text-sm">No prizes configured yet.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
}
