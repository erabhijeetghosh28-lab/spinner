'use client';

import axios from 'axios';
import { useState } from 'react';

/**
 * ManualOverrideForm Component
 * 
 * Form for Super Admins to grant bonus spins/vouchers to tenants.
 * 
 * Features:
 * - Input fields for bonus spins and bonus vouchers
 * - Required text area for reason
 * - Optional expiration date
 * - Submit button to grant override
 * - Success/error message display
 * 
 * Requirements: 4.1, 4.2, 4.3
 */

interface ManualOverrideFormProps {
  tenantId: string;
  onSuccess?: () => void;
}

export function ManualOverrideForm({ tenantId, onSuccess }: ManualOverrideFormProps) {
  const [bonusSpins, setBonusSpins] = useState<string>('');
  const [bonusVouchers, setBonusVouchers] = useState<string>('');
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const spins = parseInt(bonusSpins) || 0;
    const vouchers = parseInt(bonusVouchers) || 0;

    if (spins <= 0 && vouchers <= 0) {
      setMessage({
        type: 'error',
        text: 'Please enter at least one bonus amount (spins or vouchers)'
      });
      return;
    }

    if (!reason.trim()) {
      setMessage({
        type: 'error',
        text: 'Please provide a reason for this override'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setMessage(null);

      const payload: any = {
        bonusSpins: spins,
        bonusVouchers: vouchers,
        reason: reason.trim(),
      };

      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }

      await axios.post(`/api/admin/super/tenants/${tenantId}/overrides`, payload);

      setMessage({
        type: 'success',
        text: `Successfully granted ${spins > 0 ? `${spins} bonus spins` : ''}${spins > 0 && vouchers > 0 ? ' and ' : ''}${vouchers > 0 ? `${vouchers} bonus vouchers` : ''}`
      });

      // Reset form
      setBonusSpins('');
      setBonusVouchers('');
      setReason('');
      setExpiresAt('');

      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (error: any) {
      console.error('Error granting override:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Failed to grant override'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">Grant Bonus Limits</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Bonus Spins Input */}
        <div>
          <label htmlFor="bonusSpins" className="block text-sm font-semibold text-slate-400 mb-2">
            Bonus Spins
          </label>
          <input
            type="number"
            id="bonusSpins"
            min="0"
            value={bonusSpins}
            onChange={(e) => setBonusSpins(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            placeholder="Enter number of bonus spins"
          />
        </div>

        {/* Bonus Vouchers Input */}
        <div>
          <label htmlFor="bonusVouchers" className="block text-sm font-semibold text-slate-400 mb-2">
            Bonus Vouchers
          </label>
          <input
            type="number"
            id="bonusVouchers"
            min="0"
            value={bonusVouchers}
            onChange={(e) => setBonusVouchers(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            placeholder="Enter number of bonus vouchers"
          />
        </div>

        {/* Reason Text Area */}
        <div>
          <label htmlFor="reason" className="block text-sm font-semibold text-slate-400 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            required
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Explain why you're granting this override (e.g., 'Compensation for service outage', 'Promotional bonus for new customer')"
          />
          <p className="mt-1 text-xs text-slate-500">
            This reason will be logged and visible in the override history
          </p>
        </div>

        {/* Expiration Date (Optional) */}
        <div>
          <label htmlFor="expiresAt" className="block text-sm font-semibold text-slate-400 mb-2">
            Expiration Date (Optional)
          </label>
          <input
            type="date"
            id="expiresAt"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-slate-500">
            Leave blank for permanent override
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-500'
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}
          >
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              <span className="font-semibold">{message.text}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Granting Override...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Grant Override</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
