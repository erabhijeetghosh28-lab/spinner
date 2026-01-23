'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import ImageUploader from '@/components/admin/ImageUploader';

interface LandingPageBuilderProps {
    campaignId: string;
    tenantId: string;
    onClose: () => void;
}

export default function LandingPageBuilder({ campaignId, tenantId, onClose }: LandingPageBuilderProps) {
    const [landingPage, setLandingPage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'sections' | 'offers' | 'footer' | 'settings'>('sections');
    const [selectedSection, setSelectedSection] = useState<any>(null);

    useEffect(() => {
        fetchLandingPage();
    }, [campaignId, tenantId]);

    const fetchLandingPage = async () => {
        try {
            const res = await axios.get(`/api/admin/landing-page?campaignId=${campaignId}&tenantId=${tenantId}`);
            setLandingPage(res.data.landingPage);
        } catch (err: any) {
            console.error('Error fetching landing page:', err);
            alert(err.response?.data?.error || 'Failed to load landing page');
        } finally {
            setLoading(false);
        }
    };

    const handlePublish = async () => {
        // Validate required fields before publishing
        if (!landingPage) {
            alert('❌ Landing page not loaded. Please wait and try again.');
            return;
        }

        const errors: string[] = [];
        
        if (!landingPage.title?.trim()) {
            errors.push('Page Title');
        }
        if (!landingPage.template) {
            errors.push('Template');
        }
        if (!landingPage.metaTitle?.trim()) {
            errors.push('SEO Title');
        }
        if (!landingPage.metaDescription?.trim()) {
            errors.push('SEO Description');
        }

        // Check Hero section
        const heroSection = landingPage.sections?.find((s: any) => s.type === 'HERO');
        if (heroSection?.isVisible) {
            const heroContent = heroSection.content || {};
            if (!heroContent.headline?.trim()) errors.push('Hero Headline');
            if (!heroContent.subheadline?.trim()) errors.push('Hero Subheadline');
            if (!heroContent.buttonText?.trim()) errors.push('Hero Button Text');
        }

        // Check Footer
        if (landingPage.footer) {
            if (!landingPage.footer.companyName?.trim()) errors.push('Footer Company Name');
            if (!landingPage.footer.supportEmail?.trim()) errors.push('Footer Support Email');
        }

        if (errors.length > 0) {
            alert(`❌ Please fill in all required fields before publishing:\n\n${errors.join('\n')}`);
            return;
        }

        if (!confirm('Publish this landing page? It will be visible to users.')) return;
        
        setSaving(true);
        try {
            await axios.patch('/api/admin/landing-page', {
                campaignId,
                tenantId,
                isPublished: true,
            });
            alert('✅ Landing page published successfully! It is now live and visible to users.');
            fetchLandingPage();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to publish landing page');
        } finally {
            setSaving(false);
        }
    };

    const handleUnpublish = async () => {
        if (!confirm('Unpublish this landing page? It will no longer be visible to users.')) return;
        
        setSaving(true);
        try {
            await axios.patch('/api/admin/landing-page', {
                campaignId,
                tenantId,
                isPublished: false,
            });
            alert('⚠️ Landing page unpublished successfully! It is no longer visible to users.');
            fetchLandingPage();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to unpublish landing page');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="text-white">Loading landing page builder...</div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl w-full max-w-7xl h-[90vh] flex flex-col border border-slate-800">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black text-white">Landing Page Builder</h2>
                            {landingPage?.isPublished ? (
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/50 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    LIVE
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/50 rounded-full text-xs font-bold flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full"></span>
                                    DRAFT
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-400 mt-2">
                            {landingPage?.isPublished ? (
                                <span>Your landing page is live and visible to users</span>
                            ) : (
                                <span>Publish to make your landing page visible to users</span>
                            )}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {landingPage?.isPublished && (
                            <a
                                href={`/landing/${campaignId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
                            >
                                View Live
                            </a>
                        )}
                        {landingPage?.isPublished ? (
                            <button
                                onClick={handleUnpublish}
                                disabled={saving}
                                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                                Unpublish
                            </button>
                        ) : (
                            <button
                                onClick={handlePublish}
                                disabled={saving}
                                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                            >
                                Publish
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
                        <div className="p-4 space-y-2">
                            <button
                                onClick={() => setActiveTab('sections')}
                                className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-colors ${
                                    activeTab === 'sections'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Sections
                            </button>
                            <button
                                onClick={() => setActiveTab('offers')}
                                className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-colors ${
                                    activeTab === 'offers'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Offers
                            </button>
                            <button
                                onClick={() => setActiveTab('footer')}
                                className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-colors ${
                                    activeTab === 'footer'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Footer
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`w-full text-left px-4 py-3 rounded-lg font-bold transition-colors ${
                                    activeTab === 'settings'
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                            >
                                Settings
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'sections' && (
                            <SectionsEditor
                                landingPage={landingPage}
                                campaignId={campaignId}
                                tenantId={tenantId}
                                onUpdate={fetchLandingPage}
                            />
                        )}
                        {activeTab === 'offers' && (
                            <OffersEditor
                                landingPage={landingPage}
                                campaignId={campaignId}
                                tenantId={tenantId}
                                onUpdate={fetchLandingPage}
                            />
                        )}
                        {activeTab === 'footer' && (
                            <FooterEditor
                                landingPage={landingPage}
                                campaignId={campaignId}
                                tenantId={tenantId}
                                onUpdate={fetchLandingPage}
                            />
                        )}
                        {activeTab === 'settings' && (
                            <SettingsEditor
                                landingPage={landingPage}
                                campaignId={campaignId}
                                tenantId={tenantId}
                                onUpdate={fetchLandingPage}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sections Editor Component
function SectionsEditor({ landingPage, campaignId, tenantId, onUpdate }: any) {
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSection, setSelectedSection] = useState<any>(null);

    useEffect(() => {
        if (landingPage?.sections) {
            setSections(landingPage.sections);
        }
    }, [landingPage]);

    const handleSectionUpdate = async (sectionId: string, updates: any) => {
        try {
            await axios.put('/api/admin/landing-page/sections', {
                sectionId,
                tenantId,
                ...updates,
            });
            onUpdate();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update section');
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black text-white">Page Sections</h3>
            
            <div className="space-y-4">
                {sections.map((section) => (
                    <div
                        key={section.id}
                        className="bg-slate-800 rounded-lg p-4 border border-slate-700"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h4 className="font-bold text-white">{section.type}</h4>
                                <p className="text-xs text-slate-400">Order: {section.displayOrder}</p>
                            </div>
                            <div className="flex gap-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={section.isVisible}
                                        onChange={(e) => handleSectionUpdate(section.id, { isVisible: e.target.checked })}
                                        className="rounded"
                                    />
                                    <span className="text-sm text-slate-300">Visible</span>
                                </label>
                            </div>
                        </div>
                        
                        {section.type === 'HERO' && (
                            <HeroSectionEditor
                                section={section}
                                onUpdate={(updates: any) => handleSectionUpdate(section.id, { content: { ...section.content, ...updates } })}
                            />
                        )}
                        
                        {section.type === 'OFFERS' && (
                            <div className="text-sm text-slate-400">
                                Configure offers in the "Offers" tab
                            </div>
                        )}
                        
                        {section.type === 'FOOTER' && (
                            <div className="text-sm text-slate-400">
                                Configure footer in the "Footer" tab
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Hero Section Editor
function HeroSectionEditor({ section, onUpdate }: any) {
    const content = section.content || {};

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                    Headline <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={content.headline || ''}
                    onChange={(e) => onUpdate({ headline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="Enter headline"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                    Subheadline <span className="text-red-400">*</span>
                </label>
                <textarea
                    value={content.subheadline || ''}
                    onChange={(e) => onUpdate({ subheadline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    rows={3}
                    placeholder="Enter subheadline"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">
                    Button Text <span className="text-red-400">*</span>
                </label>
                <input
                    type="text"
                    value={content.buttonText || ''}
                    onChange={(e) => onUpdate({ buttonText: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="Spin Now"
                />
            </div>
        </div>
    );
}

// Offers Editor Component
function OffersEditor({ landingPage, campaignId, tenantId, onUpdate }: any) {
    const [offers, setOffers] = useState<any[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingOffer, setEditingOffer] = useState<any>(null);

    useEffect(() => {
        if (landingPage?.offers) {
            setOffers(landingPage.offers);
        }
    }, [landingPage]);

    const handleAddOffer = async (offerData: any) => {
        try {
            await axios.post('/api/admin/landing-page/offers', {
                landingPageId: landingPage.id,
                tenantId,
                ...offerData,
            });
            onUpdate();
            setShowAddForm(false);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to add offer');
        }
    };

    const handleUpdateOffer = async (offerId: string, offerData: any) => {
        try {
            await axios.put('/api/admin/landing-page/offers', {
                offerId,
                tenantId,
                ...offerData,
            });
            onUpdate();
            setEditingOffer(null);
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to update offer');
        }
    };

    const handleDeleteOffer = async (offerId: string) => {
        if (!confirm('Delete this offer?')) return;
        try {
            await axios.delete(`/api/admin/landing-page/offers?offerId=${offerId}&tenantId=${tenantId}`);
            onUpdate();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete offer');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-white">Offers Showcase</h3>
                {!showAddForm && !editingOffer && (
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold transition-colors"
                    >
                        + Add Offer
                    </button>
                )}
            </div>

            {showAddForm && (
                <AddOfferForm
                    onSave={handleAddOffer}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {editingOffer && (
                <EditOfferForm
                    offer={editingOffer}
                    onSave={(data: any) => handleUpdateOffer(editingOffer.id, data)}
                    onCancel={() => setEditingOffer(null)}
                />
            )}

            {!showAddForm && !editingOffer && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {offers.map((offer) => (
                        <div key={offer.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                            <div className="aspect-video bg-slate-700 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                                {offer.image ? (
                                    <img src={offer.image} alt={offer.title} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                    <span className="text-slate-500 text-sm">No Image</span>
                                )}
                            </div>
                            <h4 className="font-bold text-white mb-1">{offer.title}</h4>
                            <p className="text-xs text-slate-400 mb-2 uppercase">{offer.offerType}</p>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={() => setEditingOffer(offer)}
                                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteOffer(offer.id)}
                                    className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Add Offer Form
function AddOfferForm({ onSave, onCancel }: any) {
    const [formData, setFormData] = useState({
        offerType: 'PRODUCT',
        title: '',
        description: '',
        shortDescription: '',
        image: '',
        category: '',
        originalValue: '',
        discountValue: '',
        externalLink: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <h4 className="font-bold text-white mb-4">Add New Offer</h4>
            
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Offer Type</label>
                <select
                    value={formData.offerType}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                >
                    <option value="PRODUCT">Product</option>
                    <option value="SERVICE">Service</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="VOUCHER">Voucher</option>
                    <option value="EXPERIENCE">Experience</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Title *</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="Offer title"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    rows={3}
                    placeholder="Full description (shown in modal)"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Short Description</label>
                <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="Brief description (shown in grid)"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Product Image *</label>
                <div className="mb-2">
                    <ImageUploader
                        onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                        currentImageUrl={formData.image}
                        label="Upload Product Image"
                    />
                </div>
                <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 mt-2"
                    placeholder="Or paste image URL here"
                />
                <p className="text-xs text-slate-500 mt-1 italic">Upload image or paste URL. Image will be optimized automatically.</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Category</label>
                <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="e.g., Audio, Wearables, Lifestyle"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Original Value</label>
                    <input
                        type="text"
                        value={formData.originalValue}
                        onChange={(e) => setFormData({ ...formData, originalValue: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        placeholder="e.g., Worth ₹15,999"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Discount Value</label>
                    <input
                        type="text"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        placeholder="e.g., Get for ₹12,999"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">External Link</label>
                <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="https://..."
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                >
                    Save
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

// Edit Offer Form
function EditOfferForm({ offer, onSave, onCancel }: any) {
    const [formData, setFormData] = useState({
        offerType: offer.offerType || 'PRODUCT',
        title: offer.title || '',
        description: offer.description || '',
        shortDescription: offer.shortDescription || '',
        image: offer.image || '',
        category: offer.category || '',
        originalValue: offer.originalValue || '',
        discountValue: offer.discountValue || '',
        externalLink: offer.externalLink || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-lg p-6 border border-slate-700 space-y-4">
            <h4 className="font-bold text-white mb-4">Edit Offer</h4>
            
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Offer Type</label>
                <select
                    value={formData.offerType}
                    onChange={(e) => setFormData({ ...formData, offerType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                >
                    <option value="PRODUCT">Product</option>
                    <option value="SERVICE">Service</option>
                    <option value="DISCOUNT">Discount</option>
                    <option value="VOUCHER">Voucher</option>
                    <option value="EXPERIENCE">Experience</option>
                </select>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Title *</label>
                <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="Offer title"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    rows={3}
                    placeholder="Full description (shown in modal)"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Short Description</label>
                <input
                    type="text"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="Brief description (shown in grid)"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Product Image *</label>
                <div className="mb-2">
                    <ImageUploader
                        onUploadComplete={(url) => setFormData({ ...formData, image: url })}
                        currentImageUrl={formData.image}
                        label="Upload Product Image"
                    />
                </div>
                <input
                    type="url"
                    required
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 mt-2"
                    placeholder="Or paste image URL here"
                />
                <p className="text-xs text-slate-500 mt-1 italic">Upload image or paste URL. Image will be optimized automatically.</p>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Category</label>
                <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="e.g., Audio, Wearables, Lifestyle"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Original Value</label>
                    <input
                        type="text"
                        value={formData.originalValue}
                        onChange={(e) => setFormData({ ...formData, originalValue: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        placeholder="e.g., Worth ₹15,999"
                    />
                </div>
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Discount Value</label>
                    <input
                        type="text"
                        value={formData.discountValue}
                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        placeholder="e.g., Get for ₹12,999"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">External Link</label>
                <input
                    type="url"
                    value={formData.externalLink}
                    onChange={(e) => setFormData({ ...formData, externalLink: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                    placeholder="https://..."
                />
            </div>

            <div className="flex gap-3">
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                >
                    Update
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

// Footer Editor Component
function FooterEditor({ landingPage, campaignId, tenantId, onUpdate }: any) {
    const [footer, setFooter] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchFooter();
    }, [landingPage]);

    const fetchFooter = async () => {
        try {
            const res = await axios.get(`/api/admin/landing-page/footer?landingPageId=${landingPage?.id}&tenantId=${tenantId}`);
            setFooter(res.data.footer);
        } catch (err: any) {
            console.error('Error fetching footer:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (footerData: any) => {
        try {
            await axios.post('/api/admin/landing-page/footer', {
                landingPageId: landingPage.id,
                tenantId,
                ...footerData,
            });
            alert('Footer saved successfully!');
            fetchFooter();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save footer');
        }
    };

    if (loading) return <div className="text-slate-400">Loading...</div>;
    if (!footer) return <div className="text-slate-400">Footer not found</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black text-white">Footer Settings</h3>
            
            <FooterForm footer={footer} onSave={handleSave} />
        </div>
    );
}

// Footer Form
function FooterForm({ footer, onSave }: any) {
    const [formData, setFormData] = useState(footer);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Company Name *</label>
                <input
                    type="text"
                    required
                    value={formData.companyName || ''}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Support Email *</label>
                <input
                    type="email"
                    required
                    value={formData.supportEmail || ''}
                    onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Support Phone</label>
                <input
                    type="tel"
                    value={formData.supportPhone || ''}
                    onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Facebook URL</label>
                <input
                    type="url"
                    value={formData.facebookUrl || ''}
                    onChange={(e) => setFormData({ ...formData, facebookUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
            </div>

            <div>
                <label className="block text-sm font-bold text-slate-300 mb-1">Instagram URL</label>
                <input
                    type="url"
                    value={formData.instagramUrl || ''}
                    onChange={(e) => setFormData({ ...formData, instagramUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                />
            </div>

            <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
            >
                Save Footer
            </button>
        </form>
    );
}

// Settings Editor Component
function SettingsEditor({ landingPage, campaignId, tenantId, onUpdate }: any) {
    const [formData, setFormData] = useState({
        title: landingPage?.title || '',
        template: landingPage?.template || 'template_1',
        brandColor: landingPage?.brandColor || '#f59e0b',
        metaTitle: landingPage?.metaTitle || '',
        metaDescription: landingPage?.metaDescription || '',
    });

    const templates = [
        { value: 'template_1', name: 'Template 1 - Classic Orange', description: 'Warm orange theme with modern layout' },
        { value: 'template_2', name: 'Template 2 - Electric Cyan', description: 'Vibrant cyan/blue theme with dark navy' },
        { value: 'template_3', name: 'Template 3 - Luxury Gold', description: 'Elegant gold theme with serif fonts' },
        { value: 'template_4', name: 'Template 4', description: 'Premium design template' },
        { value: 'template_5', name: 'Template 5', description: 'Modern minimalist template' },
    ];

    const handleSave = async () => {
        // Validate required fields
        if (!formData.title.trim()) {
            alert('❌ Page Title is required');
            return;
        }
        if (!formData.metaTitle.trim()) {
            alert('❌ SEO Title is required');
            return;
        }
        if (!formData.metaDescription.trim()) {
            alert('❌ SEO Description is required');
            return;
        }
        if (!formData.template) {
            alert('❌ Template selection is required');
            return;
        }

        try {
            await axios.post('/api/admin/landing-page', {
                campaignId,
                tenantId,
                ...formData,
            });
            alert('✅ Settings saved successfully!');
            onUpdate();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to save settings');
        }
    };

    return (
        <div className="space-y-6">
            <h3 className="text-xl font-black text-white">Landing Page Settings</h3>
            <p className="text-sm text-slate-400">All fields are required. Please fill in all details before publishing.</p>
            
            <div className="space-y-4">
                {/* Template Selection */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">
                        Template <span className="text-red-400">*</span>
                    </label>
                    <select
                        value={formData.template}
                        onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        required
                    >
                        {templates.map((tpl) => (
                            <option key={tpl.value} value={tpl.value}>
                                {tpl.name} - {tpl.description}
                            </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">Select a template design for your landing page</p>
                </div>

                {/* Page Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">
                        Page Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        placeholder="Enter landing page title"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">This will be displayed on the landing page</p>
                </div>

                {/* Brand Color */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">Brand Color</label>
                    <div className="flex gap-3">
                        <input
                            type="color"
                            value={formData.brandColor}
                            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                            className="w-20 h-10 rounded-lg border border-slate-600"
                        />
                        <input
                            type="text"
                            value={formData.brandColor}
                            onChange={(e) => setFormData({ ...formData, brandColor: e.target.value })}
                            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                            placeholder="#f59e0b"
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Primary brand color used throughout the page</p>
                </div>

                {/* SEO Title */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">
                        SEO Title <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={formData.metaTitle}
                        onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        placeholder="Enter SEO meta title (50-60 characters recommended)"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">Appears in browser tabs and search results</p>
                </div>

                {/* SEO Description */}
                <div>
                    <label className="block text-sm font-bold text-slate-300 mb-1">
                        SEO Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                        value={formData.metaDescription}
                        onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600"
                        rows={3}
                        placeholder="Enter SEO meta description (150-160 characters recommended)"
                        required
                    />
                    <p className="text-xs text-slate-500 mt-1">Appears in search engine results</p>
                </div>

                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
                >
                    Save Settings
                </button>
            </div>
        </div>
    );
}
