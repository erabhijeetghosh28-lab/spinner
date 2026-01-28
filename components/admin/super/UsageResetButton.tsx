'use client';

import axios from 'axios';
import { useState } from 'react';

/**
 * UsageResetButton Component
 * 
 * Button with confirmation dialog for resetting tenant usage mid-month.
 * 
 * Features:
 * - Button to trigger reset
 * - Confirmation dialog before reset
 * - Success/error message display
 * - Callback on successful reset
 * 
 * Requirements: 4.6
 */

interface UsageResetButtonProps {
  tenantId: string;
  tenantName?: string;
  onSuccess?: () => void;
}

export function UsageResetButton({ tenantId, tenantName, onSuccess }: UsageResetButtonProps) {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setMessage(null);

      await axios.put(`/api/admin/super/tenants/${tenantId}/usage/reset`);

      setMessage({
        type: 'success',
        text: 'Usage counters successfully reset to zero'
      });

      setShowConfirmation(false);

      // Call success callback
      if (onSuccess) {
        setTimeout(onSuccess, 1000);
      }
    } catch (error: any) {
      console.error('Error resetting usage:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.error?.message || 'Failed to reset usage'
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Reset Button */}
      <button
        onClick={() => setShowConfirmation(true)}
        className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500/50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Reset Usage Mid-Month</span>
      </button>

      {/* Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-500/10 border border-orange-500/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Confirm Usage Reset</h3>
                <p className="text-sm text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            {/* Content */}
            <div className="mb-6 space-y-3">
              <p className="text-slate-300">
                Are you sure you want to reset the usage counters for{' '}
                <span className="font-bold text-white">{tenantName || 'this tenant'}</span>?
              </p>
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-2">
                <p className="text-sm text-slate-400">This will:</p>
                <ul className="text-sm text-slate-300 space-y-1 ml-4">
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Reset spins used to <span className="font-bold">0</span></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Reset vouchers used to <span className="font-bold">0</span></span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Create an audit log entry</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span>Allow the tenant to use their full monthly limits again</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setMessage(null);
                }}
                disabled={isResetting}
                className="flex-1 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800 disabled:cursor-not-allowed border border-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
              >
                {isResetting ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    <span>Reset Usage</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
