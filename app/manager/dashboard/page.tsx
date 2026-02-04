'use client';

import ManagerNav from '@/components/manager/ManagerNav';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  phone: string;
  name: string | null;
  email: string | null;
  totalSpinsGranted: number;
  remainingLimit: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // Track if search has been performed
  const [grantingSpin, setGrantingSpin] = useState<string | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('manager-token');
    const managerData = localStorage.getItem('manager-data');
    
    if (!token || !managerData) {
      router.push('/manager/login');
      return;
    }

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // Verify token is still valid by making a test request
    // (This will be caught by the error handler if token is invalid)
  }, [router]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return;
    }

    setSearching(true);
    setHasSearched(true); // Mark that a search has been performed
    try {
      // Get fresh token from localStorage
      const token = localStorage.getItem('manager-token');
      if (!token) {
        router.push('/manager/login');
        return;
      }

      const response = await axios.get('/api/manager/customers/search', {
        params: { q: searchQuery.trim() },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setSearchResults(response.data.customers || []);
    } catch (error: any) {
      console.error('Search error:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('manager-token');
        localStorage.removeItem('manager-data');
        router.push('/manager/login');
        return;
      }
      alert(error.response?.data?.error || 'Failed to search customers');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleGrantSpin = (customer: Customer) => {
    setSelectedCustomer(customer);
    setComment('');
    setShowGrantModal(true);
  };

  const handleConfirmGrant = async () => {
    if (!selectedCustomer) return;

    setGrantingSpin(selectedCustomer.id);
    try {
      // Get fresh token from localStorage
      const token = localStorage.getItem('manager-token');
      if (!token) {
        alert('Session expired. Please log in again.');
        router.push('/manager/login');
        return;
      }

      console.log('[Grant Spin] Sending request with token:', token.substring(0, 20) + '...');

      const response = await axios.post(`/api/manager/customers/${selectedCustomer.id}/grant-spin`, {
        comment: comment.trim() || undefined
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        alert(`✅ Successfully granted ${response.data.spinsGranted} spin(s)!\nRemaining: ${response.data.remainingLimit} spin(s) can be granted to this customer.`);
        setShowGrantModal(false);
        setSelectedCustomer(null);
        setComment('');
        // Refresh search results
        handleSearch();
      } else {
        alert(`❌ ${response.data.error || 'Failed to grant spin'}`);
      }
    } catch (error: any) {
      console.error('Grant spin error:', error);
      if (error.response?.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('manager-token');
        localStorage.removeItem('manager-data');
        alert('Your session has expired. Please log in again.');
        router.push('/manager/login');
        return;
      }
      alert(error.response?.data?.error || 'Failed to grant spin');
    } finally {
      setGrantingSpin(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <ManagerNav />

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Grant Spins to Customers</h1>
          <p className="text-slate-400">Search for customers and grant them bonus spins (e.g., after purchase, standee interaction, etc.)</p>
        </div>

        {/* Customer Search Section - Direct Spin Grant */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white mb-2">Search Customer</h2>
            <p className="text-slate-400 text-sm">Search by phone number or name to find customers in your tenant's database</p>
          </div>
          
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              placeholder="Search by phone or name (min 2 characters)..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim() || searchQuery.trim().length < 2}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {searchResults.map(customer => (
                <div key={customer.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="flex-1">
                    <div className="font-bold text-white">{customer.name || 'No name'}</div>
                    <div className="text-sm text-slate-400">{customer.phone}</div>
                    {customer.email && (
                      <div className="text-xs text-slate-500">{customer.email}</div>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      Spins granted: {customer.totalSpinsGranted} / {customer.totalSpinsGranted + customer.remainingLimit}
                    </div>
                  </div>
                  <button
                    onClick={() => handleGrantSpin(customer)}
                    disabled={customer.remainingLimit <= 0}
                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
                  >
                    {customer.remainingLimit <= 0 ? 'Limit Reached' : 'Grant Spin'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {hasSearched && searchResults.length === 0 && !searching && (
            <div className="text-center py-8 text-slate-400">
              No customers found matching "{searchQuery}"
            </div>
          )}
          
          {!hasSearched && searchQuery.trim().length >= 2 && (
            <div className="text-center py-8 text-slate-300">
              Click "Search" to find customers
            </div>
          )}
        </div>
      </div>

      {/* Grant Spin Modal */}
      {showGrantModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-xl">
            <div className="p-6 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white">Grant Spin to Customer</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Customer Name</div>
                <div className="text-white font-medium">{selectedCustomer.name || 'N/A'}</div>
              </div>
              
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Phone</div>
                <div className="text-white font-medium">{selectedCustomer.phone}</div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-sm text-slate-400 mb-1">Spins Already Granted</div>
                <div className="text-white font-medium">
                  {selectedCustomer.totalSpinsGranted} / {selectedCustomer.totalSpinsGranted + selectedCustomer.remainingLimit}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Remaining: {selectedCustomer.remainingLimit} spin(s) can be granted
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Comment (Optional)
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g., 'Customer purchased product', 'Completed standee task', 'Rated our service'"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-1">Add a note about why you're granting this spin</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-800 flex gap-3">
              <button
                onClick={() => {
                  setShowGrantModal(false);
                  setSelectedCustomer(null);
                  setComment('');
                }}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all"
                disabled={grantingSpin === selectedCustomer.id}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmGrant}
                disabled={grantingSpin === selectedCustomer.id || selectedCustomer.remainingLimit <= 0}
                className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-400 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {grantingSpin === selectedCustomer.id ? 'Granting...' : 'Grant 1 Spin'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
