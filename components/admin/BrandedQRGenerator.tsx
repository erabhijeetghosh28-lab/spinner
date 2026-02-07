'use client';

import axios from 'axios';
import { CreditCard, Download, Image } from 'lucide-react';
import { useState } from 'react';

interface BrandedQRGeneratorProps {
  campaignId: string;
  campaignName: string;
  tenantId: string | null;
}

export function BrandedQRGenerator({ campaignId, campaignName, tenantId }: BrandedQRGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateAndDownload = async (type: 'poster' | 'card') => {
    if (!tenantId) {
      alert('Tenant ID not found. Please refresh the page.');
      return;
    }
    setIsGenerating(true);
    
    try {
      // Use axios for consistent authentication (headers set in AdminDashboard)
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin-token') : null;
      const headers: any = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (tenantId) headers['x-tenant-id'] = tenantId;
      const response = await axios.post(`/api/admin/qr/branded?tenantId=${tenantId}`, {
        campaignId,
        type,
        download: true
      }, {
        responseType: 'blob',
        headers
      });

      // Create download from blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${campaignName.replace(/[^a-zA-Z0-9]/g, '-')}-${type}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

    } catch (error: any) {
      console.error('Error generating branded QR:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to generate branded QR';
      alert(`Failed to generate branded QR: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Image className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-white">Branded QR Codes</h3>
      </div>
      
      <p className="text-slate-400 mb-6">
        Generate professional branded QR code materials for your campaign with your business information.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Poster */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-900">
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-blue-400" />
            <h4 className="font-medium text-white">Poster (800×1200)</h4>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">
            Large format poster perfect for printing and display in your store.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => generateAndDownload('poster')}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download Poster'}
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="border border-slate-700 rounded-lg p-4 bg-slate-900">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-4 h-4 text-green-400" />
            <h4 className="font-medium text-white">Card (600×400)</h4>
          </div>
          
          <p className="text-sm text-slate-400 mb-4">
            Compact card format perfect for social media, flyers, or table tents.
          </p>

          <div className="space-y-2">
            <button
              onClick={() => generateAndDownload('card')}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Download Card'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
        <h5 className="font-medium text-amber-400 mb-2">What's included:</h5>
        <ul className="text-sm text-amber-300 space-y-1">
          <li>• Campaign name prominently displayed</li>
          <li>• QR code linking to your campaign</li>
          <li>• Business name and contact information</li>
          <li>• Professional branding and layout</li>
          <li>• High-resolution PNG format</li>
        </ul>
      </div>
    </div>
  );
}