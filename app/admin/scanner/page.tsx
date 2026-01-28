'use client';

import AdminNav from '@/components/admin/AdminNav';
import axios from 'axios';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface ValidationResult {
  valid: boolean;
  voucher?: {
    code: string;
    prize: { name: string; description: string };
    customer: { name: string; phone: string };
    expiresAt: string;
    redemptionCount: number;
    redemptionLimit: number;
  };
  reason?: string;
  details?: any;
}

interface VoucherLookupResult {
  code: string;
  prize: { name: string };
  status: 'active' | 'redeemed' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export default function ScannerPage() {
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [lookupResults, setLookupResults] = useState<VoucherLookupResult[]>([]);
  const [error, setError] = useState('');
  const [cameraError, setCameraError] = useState('');
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = 'qr-reader';
  
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    const storedTenantId = localStorage.getItem('admin-tenant-id');
    const storedAdminData = localStorage.getItem('admin-data');

    if (!token) {
      router.push('/admin');
      return;
    }

    if (storedTenantId) {
      setTenantId(storedTenantId);
    }

    if (storedAdminData) {
      try {
        const admin = JSON.parse(storedAdminData);
        if (admin) {
          if (admin.isSuperAdmin) {
            router.push('/admin/super/dashboard');
            return;
          }
          if (admin.id) {
            setMerchantId(admin.id);
          }
        }
      } catch (err) {
        console.error('Error parsing admin data:', err);
        // Not a fatal error, but log it
      }
    }

    // Set global axios headers
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (storedTenantId) {
      axios.defaults.headers.common['x-tenant-id'] = storedTenantId;
    }

    setLoading(false);
  }, [router]);

  const isScannerRunningRef = useRef(false);

  useEffect(() => {
    // Cleanup scanner on unmount
    return () => {
      if (html5QrCodeRef.current && isScannerRunningRef.current) {
        html5QrCodeRef.current.stop().catch(err => {
          console.warn('Failed to stop scanner on unmount:', err);
        });
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setCameraError('');
      setError('');
      
      // 1. Show the scanner container first so it has dimensions (clientWidth)
      setScanning(true);
      
      // 2. Wait for React/DOM to render the class change from hidden -> block
      await new Promise(resolve => setTimeout(resolve, 100));

      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerDivId);
      }

      // If already running (marked by our ref), don't start again
      if (isScannerRunningRef.current) {
        return;
      }

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        videoConstraints: {
          facingMode: 'environment',
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          focusMode: 'continuous'
        },
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true
        },
        verbose: false
      };

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          console.log('QR Code detected:', decodedText);
          await stopScanning();
          await validateVoucher(decodedText);
        },
        (errorMessage) => {
          // ignore
        }
      );

      isScannerRunningRef.current = true;
    } catch (err: any) {
      console.error('Camera error:', err);
      setCameraError(err.message || 'Failed to access camera. Please ensure HTTPS and camera permissions are granted.');
      isScannerRunningRef.current = false;
      setScanning(false);
    }
  };

  const stopScanning = async () => {
    if (!html5QrCodeRef.current) return;
    
    // Optimistically update UI
    setScanning(false);

    try {
      if (isScannerRunningRef.current) {
        isScannerRunningRef.current = false;
        await html5QrCodeRef.current.stop();
      }
    } catch (err) {
      console.warn('Error stopping scanner:', err);
      // Ensure state is consistent even if stop failed (e.g. already stopped)
      isScannerRunningRef.current = false;
    } finally {
      // Clear the ref so we create a new instance next time. 
      // This is crucial because the <div> might be unmounted/remounted (e.g. when showing validation results),
      // and checking !html5QrCodeRef.current in startScanning ensures we verify the DOM element exists again.
      // html5-qrcode might cache the element reference.
      html5QrCodeRef.current = null;
    }
  };

  const validateVoucher = async (code: string) => {
    if (!code.trim()) {
      setError('Please enter a voucher code');
      return;
    }

    // Get tenantId from state or localStorage
    const currentTenantId = tenantId || localStorage.getItem('admin-tenant-id');
    
    if (!currentTenantId) {
      setError('Tenant ID not found. Please log in again.');
      return;
    }

    // Ensure scanner is stopped before validation
    if (scanning) {
      await stopScanning();
    }

    setValidating(true);
    setError('');
    setValidationResult(null);

    try {
      const response = await axios.post('/api/vouchers/validate', { 
        code: code.trim(),
        tenantId: currentTenantId
      });
      setValidationResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to validate voucher');
      setValidationResult(null);
    } finally {
      setValidating(false);
    }
  };

  const redeemVoucher = async (code: string) => {
    if (!confirm('Are you sure you want to redeem this voucher?')) {
      return;
    }

    // Get tenantId from state or localStorage
    const currentTenantId = tenantId || localStorage.getItem('admin-tenant-id');
    
    if (!currentTenantId) {
      setError('Tenant ID not found. Please log in again.');
      return;
    }

    setRedeeming(true);
    setError('');

    try {
      const response = await axios.post('/api/vouchers/redeem', { 
        code,
        merchantId: merchantId,
        tenantId: currentTenantId
      });
      
      if (response.data.success) {
        alert('Voucher redeemed successfully!');
        // Clear validation result and manual code
        setValidationResult(null);
        setManualCode('');
        // Automatically start scanning again for next voucher
        setTimeout(() => {
          startScanning();
        }, 500);
      } else {
        setError(response.data.error || 'Failed to redeem voucher');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to redeem voucher');
    } finally {
      setRedeeming(false);
    }
  };

  const lookupByPhone = async () => {
    if (!phoneNumber.trim()) {
      setError('Please enter a phone number');
      return;
    }

    // Get tenantId from state or localStorage
    const currentTenantId = tenantId || localStorage.getItem('admin-tenant-id');
    
    if (!currentTenantId) {
      setError('Tenant ID not found. Please log in again.');
      return;
    }

    setLookingUp(true);
    setError('');
    setLookupResults([]);

    try {
      const response = await axios.post('/api/vouchers/lookup-phone', { 
        phone: phoneNumber.trim(),
        tenantId: currentTenantId
      });
      setLookupResults(response.data.vouchers || []);
      
      if (response.data.vouchers.length === 0) {
        setError('No vouchers found for this phone number');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to lookup vouchers');
    } finally {
      setLookingUp(false);
    }
  };

  const selectVoucherFromLookup = async (code: string) => {
    setLookupResults([]);
    setPhoneNumber('');
    await validateVoucher(code);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <AdminNav />
      
      <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-500">Scan Voucher</h1>
        </div>

        {/* QR Scanner Section (and Validation Result) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">
            {validationResult ? 'Validation Result' : 'QR Code Scanner'}
          </h2>
          
          {validationResult ? (
             <div className={`border rounded-xl p-8 ${
                validationResult.valid 
                  ? 'bg-green-500/10 border-green-500' 
                  : 'bg-red-500/10 border-red-500'
              }`}>
                <h2 className="text-2xl font-bold mb-6">
                  {validationResult.valid ? '✓ Valid Voucher' : '✗ Invalid Voucher'}
                </h2>

                {validationResult.valid && validationResult.voucher ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Voucher Code</p>
                        <p className="text-xl font-bold text-amber-500">{validationResult.voucher.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Status</p>
                        <p className="text-xl font-bold text-green-500">VALID</p>
                      </div>
                    </div>

                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-sm text-slate-400 mb-2">Prize</p>
                      <p className="text-lg font-bold">{validationResult.voucher.prize.name}</p>
                      {validationResult.voucher.prize.description && (
                        <p className="text-sm text-slate-400 mt-1">{validationResult.voucher.prize.description}</p>
                      )}
                    </div>

                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-sm text-slate-400 mb-2">Customer</p>
                      <p className="font-bold">{validationResult.voucher.customer.name}</p>
                      <p className="text-sm text-slate-400">{validationResult.voucher.customer.phone}</p>
                    </div>

                    <div className="border-t border-slate-700 pt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Expires</p>
                        <p className="font-bold">{new Date(validationResult.voucher.expiresAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Redemptions</p>
                        <p className="font-bold">
                          {validationResult.voucher.redemptionCount} / {validationResult.voucher.redemptionLimit}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => redeemVoucher(validationResult.voucher!.code)}
                      disabled={redeeming}
                      className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-bold rounded-xl transition-all mt-6 disabled:opacity-50"
                    >
                      {redeeming ? 'Redeeming...' : 'Redeem Voucher'}
                    </button>
                    
                    <button
                      onClick={() => {
                        setValidationResult(null);
                        setManualCode('');
                        startScanning();
                      }}
                      className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all mt-3"
                    >
                      Scan Another Voucher
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">
                      <span className="font-bold">Reason:</span> {validationResult.reason}
                    </p>
                    {validationResult.details && (
                      <div className="text-sm text-slate-400 mt-4">
                        {validationResult.details.expiresAt && (
                          <p>Expired on: {new Date(validationResult.details.expiresAt).toLocaleDateString()}</p>
                        )}
                        {validationResult.details.redeemedAt && (
                          <p>Redeemed on: {new Date(validationResult.details.redeemedAt).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                    
                    <button
                      onClick={() => {
                        setValidationResult(null);
                        setManualCode('');
                        setError('');
                        startScanning();
                      }}
                      className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all mt-6"
                    >
                      Scan Another Voucher
                    </button>
                  </div>
                )}
              </div>
          ) : (
            <>
              <div className="mb-6">
                {scanning && (
                  <div className="mb-4 bg-amber-500/20 border border-amber-500 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-pulse w-3 h-3 bg-amber-500 rounded-full"></div>
                      <span className="text-amber-500 font-semibold">Scanning for QR codes...</span>
                    </div>
                    <p className="text-xs text-amber-400 mt-1">Position QR code within the frame</p>
                  </div>
                )}
                
                <div 
                  id={scannerDivId} 
                  className={`${scanning ? 'block' : 'hidden'} w-full rounded-xl overflow-hidden border-4 ${
                    scanning ? 'border-amber-500 shadow-lg shadow-amber-500/50' : 'border-slate-700'
                  }`}
                  style={{ 
                    minHeight: '400px',
                    maxWidth: '100%',
                    position: 'relative'
                  }}
                />
                
                {!scanning && (
                  <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-xl p-12 text-center min-h-[400px] flex flex-col items-center justify-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <p className="text-slate-400">Camera preview will appear here</p>
                  </div>
                )}
              </div>
              
              {/* Add global CSS for the scanner video element */}
              <style jsx global>{`
                #qr-reader video {
                  width: 100% !important;
                  height: auto !important;
                  border-radius: 0.75rem;
                }
                #qr-reader {
                  border-radius: 0.75rem;
                }
                #qr-reader__dashboard {
                  display: none !important;
                }
                #qr-reader__dashboard_section {
                  display: none !important;
                }
                #qr-reader__camera_selection {
                  display: none !important;
                }
              `}</style>
    
              {cameraError && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-4 text-sm">
                  {cameraError}
                </div>
              )}
    
              <div className="flex gap-4">
                {!scanning ? (
                  <button
                    onClick={startScanning}
                    className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all"
                  >
                    Start Camera
                  </button>
                ) : (
                  <button
                    onClick={stopScanning}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-400 text-white font-bold rounded-xl transition-all"
                  >
                    Stop Camera
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Manual Entry Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">Manual Entry</h2>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter voucher code (e.g., ACME-X7K9P2M4)"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  validateVoucher(manualCode);
                }
              }}
            />
            <button
              onClick={() => validateVoucher(manualCode)}
              disabled={validating || !manualCode.trim()}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? 'Validating...' : 'Validate'}
            </button>
          </div>
        </div>

        {/* Phone Lookup Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">Phone Number Lookup</h2>
          
          <div className="flex gap-4 mb-4">
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter customer phone number"
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white outline-none focus:ring-2 focus:ring-amber-500"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  lookupByPhone();
                }
              }}
            />
            <button
              onClick={lookupByPhone}
              disabled={lookingUp || !phoneNumber.trim()}
              className="px-8 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {lookingUp ? 'Searching...' : 'Search'}
            </button>
          </div>

          {lookupResults.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 mb-3">Found {lookupResults.length} voucher(s):</p>
              {lookupResults.map((voucher, idx) => (
                <div
                  key={idx}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-amber-500 transition-colors cursor-pointer"
                  onClick={() => selectVoucherFromLookup(voucher.code)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-amber-500">{voucher.code}</p>
                      <p className="text-sm text-slate-300">{voucher.prize.name}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      voucher.status === 'active' ? 'bg-green-500/20 text-green-500' :
                      voucher.status === 'redeemed' ? 'bg-blue-500/20 text-blue-500' :
                      'bg-red-500/20 text-red-500'
                    }`}>
                      {voucher.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

      </div>
      </div>
    </div>
  );
}
