 'use client';

 import AdminNav from '@/components/admin/AdminNav';
 import axios from 'axios';
 import React, { useEffect, useState } from 'react';

 export default function BillingPage() {
   const [plans, setPlans] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
   const [showModal, setShowModal] = useState(false);
   const [invoices] = useState<any[]>([
     { id: 'INV-2026-001', date: '2026-01-01', amount: 4999, status: 'Paid' },
     { id: 'INV-2025-12-004', date: '2025-12-01', amount: 4999, status: 'Paid' },
   ]);

   useEffect(() => {
     const token = localStorage.getItem('admin-token') || localStorage.getItem('super-admin-token');
     if (token) {
       axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
     }

     (async () => {
       try {
         const res = await axios.get('/api/admin/super/plans');
         setPlans(res.data.plans || []);
       } catch (err) {
         console.error('Failed to fetch plans', err);
         setPlans([]);
       } finally {
         setLoading(false);
       }
     })();
   }, []);

   const handleChoose = (plan: any) => {
     setSelectedPlan(plan);
     setShowModal(true);
   };

   const handleConfirmUpgrade = async () => {
     if (!selectedPlan) return;
     try {
       // Placeholder: call to payment/subscribe API should go here
       await axios.post('/api/admin/subscribe', { planId: selectedPlan.id }).catch(() => null);
       alert(`Subscribed to ${selectedPlan.name} (mock).`);
       setShowModal(false);
     } catch (err: any) {
       console.error('Upgrade failed', err);
       alert(err?.response?.data?.error || 'Upgrade failed');
     }
   };

   return (
     <div className="min-h-screen bg-slate-950 text-white">
       <AdminNav />
       <div className="max-w-6xl mx-auto p-6">
         <h1 className="text-2xl font-bold mb-4">Billing & Plans</h1>
         <p className="text-slate-400 mb-6">Manage your subscription, payment methods and invoices.</p>

         <section className="mb-8">
           <h2 className="text-lg font-semibold mb-4">Available Plans</h2>
           {loading ? (
             <div className="p-6 bg-slate-900 rounded-lg">Loading plans...</div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {plans.map((plan) => (
                 <div key={plan.id} className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-sm">
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <div className="text-xl font-bold">{plan.name}</div>
                       <div className="text-slate-400 text-sm mt-1">{plan.description || ''}</div>
                     </div>
                     <div className="text-2xl font-extrabold text-amber-400">
                       {plan.price ? `₹${(plan.price / 100).toFixed(0)}` : 'Free'}
                     </div>
                   </div>

                   <ul className="text-sm text-slate-400 space-y-2 mb-4">
                     <li>• {plan.campaignsPerMonth ?? '—'} campaigns / month</li>
                     <li>• {plan.spinsPerCampaign ?? '—'} spins / campaign</li>
                     <li>• Social tasks: {plan.socialMediaEnabled ? 'Yes' : 'No'}</li>
                   </ul>

                   <div className="flex items-center justify-between">
                     <button
                       onClick={() => handleChoose(plan)}
                       className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-4 py-2 rounded-lg"
                     >
                       Choose
                     </button>
                     <a href="#details" className="text-slate-400 text-sm underline">Details</a>
                   </div>
                 </div>
               ))}
             </div>
           )}
         </section>

         <section className="mb-8">
           <h2 className="text-lg font-semibold mb-4">Invoices</h2>
           <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
             {invoices.length === 0 ? (
               <div className="text-slate-400">No invoices found.</div>
             ) : (
               <table className="w-full text-left">
                 <thead className="text-slate-400 text-xs uppercase">
                   <tr>
                     <th className="py-2">Invoice</th>
                     <th className="py-2">Date</th>
                     <th className="py-2">Amount</th>
                     <th className="py-2">Status</th>
                     <th className="py-2 text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {invoices.map((inv) => (
                     <tr key={inv.id} className="border-t border-slate-800">
                       <td className="py-3">{inv.id}</td>
                       <td className="py-3 text-slate-400">{inv.date}</td>
                       <td className="py-3">₹{inv.amount}</td>
                       <td className="py-3 text-slate-400">{inv.status}</td>
                       <td className="py-3 text-right">
                         <button className="text-amber-400 underline text-sm">Download</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>
         </section>

         {/* Modal */}
         {showModal && selectedPlan && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
             <div className="bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-800">
               <div className="flex justify-between items-start">
                 <div>
                   <h3 className="text-xl font-bold">{selectedPlan.name}</h3>
                   <p className="text-slate-400 text-sm mt-1">Confirm upgrade to {selectedPlan.name}.</p>
                 </div>
                 <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">✕</button>
               </div>

               <div className="mt-4">
                 <p className="text-sm text-slate-300">This is a placeholder upgrade flow. Integrate your payment gateway here to allow customers to subscribe programmatically.</p>
               </div>

               <div className="mt-6 flex justify-end space-x-3">
                 <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-700 rounded-lg">Cancel</button>
                 <button onClick={handleConfirmUpgrade} className="px-4 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg">Proceed (Mock)</button>
               </div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 }

