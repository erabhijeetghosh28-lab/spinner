'use client';

import AdminNav from '@/components/admin/AdminNav';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Manager {
  id: string;
  name: string;
  maxBonusSpinsPerApproval: number;
  maxSpinsPerUser?: number;
  isActive: boolean;
  createdAt: string;
  stats: {
    totalApprovals: number;
    totalBonusSpinsGranted: number;
  };
  pin?: string; // PIN shown only when available (after creation or reset)
}

export default function ManagersPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [managerPins, setManagerPins] = useState<Record<string, string>>({}); // Store PINs by manager ID
  const [resettingPin, setResettingPin] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  useEffect(() => {
    fetchManagers();
  }, []);

  const fetchManagers = async () => {
    try {
      setLoading(true);
      const tenantId = localStorage.getItem('admin-tenant-id');
      
      if (!tenantId) {
        router.push('/admin');
        return;
      }

      const response = await fetch(`/api/admin/managers?tenantId=${tenantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
          'x-tenant-id': tenantId || ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch managers');
      }

      const data = await response.json();
      // Preserve existing PINs when refreshing
      const managersWithPins = data.managers.map((m: Manager) => ({
        ...m,
        pin: managerPins[m.id] || m.pin
      }));
      setManagers(managersWithPins);
    } catch (err) {
      setError('Failed to load managers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (manager: Manager) => {
    setSelectedManager(manager);
    setShowEditModal(true);
  };

  const handleResetPin = async (managerId: string) => {
    if (!confirm('Are you sure you want to reset this manager\'s PIN? The old PIN will no longer work.')) {
      return;
    }

    setResettingPin(managerId);
    try {
      const tenantId = localStorage.getItem('admin-tenant-id');
      const response = await fetch(`/api/admin/managers/${managerId}/reset-pin?tenantId=${tenantId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
          'x-tenant-id': tenantId || ''
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reset PIN');
      }

      const data = await response.json();
      if (data.pin) {
        // Store PIN in state
        setManagerPins(prev => ({ ...prev, [managerId]: data.pin }));
        // Update manager in list with new PIN
        setManagers(prev => prev.map(m => 
          m.id === managerId ? { ...m, pin: data.pin } : m
        ));
        alert(`✅ PIN reset successfully!\n\nNew PIN: ${data.pin}\n\nShare this with the manager.`);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to reset PIN');
    } finally {
      setResettingPin(null);
    }
  };

  const handleCopyLoginLink = (managerId: string) => {
    const loginUrl = `${window.location.origin}/manager/login?id=${managerId}`;
    navigator.clipboard.writeText(loginUrl).then(() => {
      setCopiedLink(managerId);
      setTimeout(() => setCopiedLink(null), 2000);
    }).catch(() => {
      alert('Failed to copy link. Please copy manually: ' + loginUrl);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <AdminNav />
        <div className="max-w-7xl mx-auto p-8">
          <div className="text-center text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <AdminNav />
      <div className="max-w-7xl mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manager Management</h1>
            <p className="text-slate-400 mt-2">Create and manage verification managers</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-xl transition-all"
          >
            Add Manager
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Max Bonus Spins
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Max Spins/User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Total Approvals
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Spins Granted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Manager ID / PIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {managers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                    No managers yet. Create your first manager to get started.
                  </td>
                </tr>
              ) : (
                managers.map((manager) => (
                  <tr key={manager.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-white">{manager.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        manager.isActive 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {manager.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {manager.maxBonusSpinsPerApproval}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {manager.maxSpinsPerUser || 5}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {manager.stats.totalApprovals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {manager.stats.totalBonusSpinsGranted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-xs">
                        <div className="text-slate-400 mb-1">ID: <span className="text-slate-300 font-mono">{manager.id}</span></div>
                        {manager.pin ? (
                          <div className="text-green-400 font-bold">PIN: <span className="text-green-300 tracking-widest">{manager.pin}</span></div>
                        ) : (
                          <div className="text-slate-500">PIN: Not available</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleEdit(manager)}
                          className="text-amber-500 hover:text-amber-400 text-left"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleCopyLoginLink(manager.id)}
                          className="text-green-500 hover:text-green-400 text-left"
                        >
                          {copiedLink === manager.id ? '✓ Link Copied!' : 'Copy Login Link'}
                        </button>
                        <button
                          onClick={() => handleResetPin(manager.id)}
                          disabled={resettingPin === manager.id}
                          className="text-blue-500 hover:text-blue-400 text-left disabled:opacity-50"
                        >
                          {resettingPin === manager.id ? 'Resetting...' : 'Reset PIN'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <CreateManagerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newManager) => {
            setShowCreateModal(false);
            if (newManager?.pin) {
              // Store PIN for display in the list
              setManagerPins(prev => ({ ...prev, [newManager.id]: newManager.pin! }));
            }
            fetchManagers();
          }}
        />
      )}

      {showEditModal && selectedManager && (
        <EditManagerModal
          manager={selectedManager}
          onClose={() => {
            setShowEditModal(false);
            setSelectedManager(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedManager(null);
            fetchManagers();
          }}
        />
      )}
    </div>
  );
}

function CreateManagerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (manager?: Manager) => void }) {
  const [name, setName] = useState('');
  const [maxBonusSpins, setMaxBonusSpins] = useState(10);
  const [maxSpinsPerUser, setMaxSpinsPerUser] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdPin, setCreatedPin] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const tenantId = localStorage.getItem('admin-tenant-id');
      const response = await fetch('/api/admin/managers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
          'x-tenant-id': tenantId || ''
        },
        body: JSON.stringify({
          tenantId,
          name: name.trim(),
          maxBonusSpinsPerApproval: maxBonusSpins,
          maxSpinsPerUser: maxSpinsPerUser
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create manager');
      }

      const data = await response.json();
      if (data.manager?.pin) {
        setCreatedPin(data.manager.pin);
        setCreatedManager({ ...data.manager, pin: data.manager.pin } as Manager);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Create Manager</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Enter manager name"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Bonus Spins Per Approval
            </label>
            <input
              type="number"
              value={maxBonusSpins || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMaxBonusSpins(isNaN(val) ? 10 : val);
              }}
              min="1"
              max="10000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-slate-400 mt-1">
              Maximum bonus spins this manager can grant per task approval (max: 10,000)
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Spins Per User (Direct Grant)
            </label>
            <input
              type="number"
              value={maxSpinsPerUser || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMaxSpinsPerUser(isNaN(val) ? 5 : val);
              }}
              min="1"
              max="10000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-slate-400 mt-1">
              Maximum total spins this manager can grant to each user (for standee use case, max: 10,000)
            </p>
          </div>

          {createdPin && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
              <p className="text-sm font-medium text-green-400 mb-2">✅ Manager created successfully!</p>
              <p className="text-sm text-green-300 mb-2">Manager PIN (save this - it won't be shown again):</p>
              <div className="bg-slate-800 border-2 border-green-500/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400 tracking-widest">{createdPin}</p>
              </div>
              <p className="text-xs text-green-400 mt-2">Share this PIN with the manager for login</p>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            {createdPin && createdManager ? (
              <button
                type="button"
                onClick={() => {
                  setCreatedPin(null);
                  setCreatedManager(null);
                  onSuccess(createdManager);
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-all"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg disabled:opacity-50 transition-all"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Manager'}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function EditManagerModal({ 
  manager, 
  onClose, 
  onSuccess 
}: { 
  manager: Manager; 
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [name, setName] = useState(manager.name);
  const [maxBonusSpins, setMaxBonusSpins] = useState(manager.maxBonusSpinsPerApproval);
  const [maxSpinsPerUser, setMaxSpinsPerUser] = useState(manager.maxSpinsPerUser || 5);
  const [isActive, setIsActive] = useState(manager.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const tenantId = localStorage.getItem('admin-tenant-id');
      const response = await fetch(`/api/admin/managers/${manager.id}?tenantId=${tenantId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin-token')}`,
          'x-tenant-id': tenantId || ''
        },
        body: JSON.stringify({
          name: name.trim(),
          maxBonusSpinsPerApproval: maxBonusSpins,
          maxSpinsPerUser: maxSpinsPerUser,
          isActive
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update manager');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Manager</h2>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Bonus Spins Per Approval
            </label>
            <input
              type="number"
              value={maxBonusSpins || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMaxBonusSpins(isNaN(val) ? manager.maxBonusSpinsPerApproval : val);
              }}
              min="1"
              max="10000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-slate-400 mt-1">
              Maximum bonus spins this manager can grant per task approval (max: 10,000)
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Max Spins Per User (Direct Grant)
            </label>
            <input
              type="number"
              value={maxSpinsPerUser || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                setMaxSpinsPerUser(isNaN(val) ? (manager.maxSpinsPerUser || 5) : val);
              }}
              min="1"
              max="10000"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              required
            />
            <p className="text-sm text-slate-400 mt-1">
              Maximum total spins this manager can grant to each user (for standee use case, max: 10,000)
            </p>
          </div>

          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="mr-2 w-4 h-4 text-amber-500 bg-slate-800 border-slate-700 rounded focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-slate-300">Active</span>
            </label>
            <p className="text-sm text-slate-400 mt-1">
              Inactive managers cannot log in
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg disabled:opacity-50 transition-all"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
