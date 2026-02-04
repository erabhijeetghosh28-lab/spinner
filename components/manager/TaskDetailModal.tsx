'use client';

import axios from 'axios';
import { useState } from 'react';

interface TaskCompletion {
  id: string;
  taskType: string;
  targetUrl: string;
  submittedAt: string;
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'FAILED';
  customer: {
    id: string;
    phoneLast4: string;
  };
  task: {
    bonusSpins: number;
    description: string;
  };
  verificationComment?: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

interface TaskDetailModalProps {
  task: TaskCompletion | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TaskDetailModal({ task, onClose, onSuccess }: TaskDetailModalProps) {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Guard against undefined/null task
  if (!task || !task.id) {
    return null;
  }

  const handleApprove = async () => {
    // Validate comment
    if (!comment.trim()) {
      setError('Comment is required');
      return;
    }

    if (!task?.id) {
      setError('Task ID is missing');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await axios.post(`/api/manager/tasks/${task.id}/approve`, { 
        comment: comment.trim() 
      });
      
      const bonusSpins = response.data.bonusSpinsGranted || task.task?.bonusSpins || 0;
      setSuccessMessage(`Task approved! ${bonusSpins} bonus spins granted to customer.`);
      
      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to approve task';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    // Validate comment
    if (!comment.trim()) {
      setError('Comment is required');
      return;
    }

    if (!task?.id) {
      setError('Task ID is missing');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      await axios.post(`/api/manager/tasks/${task.id}/reject`, { 
        comment: comment.trim() 
      });
      
      setSuccessMessage('Task rejected. Customer has been notified.');
      
      // Wait a moment to show success message
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reject task';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start p-6 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Task Details</h2>
            <p className="text-slate-400 text-sm mt-1">Review and verify task completion</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-white transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Customer Info - Minimal data exposure */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 uppercase mb-3 flex items-center">
              <span className="mr-2">👤</span>
              Customer Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-500 mb-1">Customer ID</div>
                <div className="text-white font-mono text-sm">{task.customer?.id ? task.customer.id.slice(0, 12) + '...' : 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Phone (Last 4 digits)</div>
                <div className="text-white font-medium text-sm">***{task.customer?.phoneLast4 || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Task Info - Full task information */}
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
            <h3 className="text-sm font-medium text-slate-400 uppercase mb-3 flex items-center">
              <span className="mr-2">📋</span>
              Task Information
            </h3>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-slate-500 mb-1">Task Type</div>
                <div className="text-white font-medium">{task.taskType || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Task Requirements</div>
                <div className="text-white">{task.task?.description || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Target URL</div>
                <a
                  href={task.targetUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-400 hover:text-amber-300 break-all text-sm underline decoration-dotted"
                >
                  {task.targetUrl || 'N/A'}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Bonus Spins</div>
                  <div className="text-amber-400 font-bold text-lg flex items-center">
                    <span className="mr-1">🎰</span>
                    {task.task?.bonusSpins || 0}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Current Status</div>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                    task.status === 'VERIFIED' ? 'bg-green-500/20 text-green-400' :
                    task.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>
                    {task.status || 'UNKNOWN'}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 mb-1">Submission Time</div>
                <div className="text-white text-sm">
                  {task.submittedAt ? new Date(task.submittedAt).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  }) : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Verification History - Show for VERIFIED/REJECTED tasks */}
          {task.status && (task.status === 'VERIFIED' || task.status === 'REJECTED') && task.verificationComment && (
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 uppercase mb-3 flex items-center">
                <span className="mr-2">📝</span>
                Verification History
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-500 mb-1">Manager Comment</div>
                  <div className="text-white text-sm bg-slate-900/50 p-3 rounded border border-slate-700/30">
                    {task.verificationComment}
                  </div>
                </div>
                {task.verifiedAt && (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">Verified At</div>
                    <div className="text-white text-sm">
                      {new Date(task.verifiedAt).toLocaleString('en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verification Section - Only show for PENDING tasks */}
          {task.status === 'PENDING' && task.id && (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-800/30 rounded-lg p-4 border border-slate-700/50">
              <h3 className="text-sm font-medium text-slate-400 uppercase mb-3 flex items-center">
                <span className="mr-2">✍️</span>
                Verification Decision
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Comment <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => {
                      setComment(e.target.value);
                      setError('');
                    }}
                    placeholder="Explain your decision (required)..."
                    rows={4}
                    disabled={loading}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Provide a clear explanation for your approval or rejection decision
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-start">
                    <span className="text-red-400 mr-2">⚠️</span>
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {successMessage && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 flex items-start">
                    <span className="text-green-400 mr-2">✓</span>
                    <p className="text-green-400 text-sm">{successMessage}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleApprove}
                    disabled={loading || !!successMessage}
                    className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-green-500/20"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✓</span>
                        Approve Task
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={loading || !!successMessage}
                    className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg shadow-red-500/20"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <span className="mr-2">✗</span>
                        Reject Task
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 sticky bottom-0 bg-slate-900">
          <button
            onClick={onClose}
            disabled={loading}
            className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
