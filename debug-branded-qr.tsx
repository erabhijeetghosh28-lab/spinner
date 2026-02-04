'use client';

import { useState } from 'react';

// Minimal reproduction of the branded QR issue
export default function DebugBrandedQR() {
    const [showBrandedQRModal, setShowBrandedQRModal] = useState(false);
    const [brandedQRCampaign, setBrandedQRCampaign] = useState<{id: string, name: string} | null>(null);

    const handleShowBrandedQR = (campaign: {id: string, name: string}) => {
        setBrandedQRCampaign(campaign);
        setShowBrandedQRModal(true);
    };

    return (
        <div className="p-4">
            <h1>Debug Branded QR</h1>
            <button
                onClick={() => handleShowBrandedQR({ id: 'test-id', name: 'Test Campaign' })}
                className="bg-blue-500 text-white px-4 py-2 rounded"
            >
                Test Branded QR Modal
            </button>

            {showBrandedQRModal && brandedQRCampaign && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
                    <div className="bg-white p-8 rounded">
                        <h2>Branded QR Modal for: {brandedQRCampaign.name}</h2>
                        <button
                            onClick={() => setShowBrandedQRModal(false)}
                            className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}