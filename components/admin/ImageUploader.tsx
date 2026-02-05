'use client';

import { useState, useEffect } from 'react';
import { generateReactHelpers } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

const { useUploadThing } = generateReactHelpers<OurFileRouter>();

interface ImageUploaderProps {
    onUploadComplete: (url: string) => void;
    currentImageUrl?: string;
    label?: string;
}

export default function ImageUploader({
    onUploadComplete,
    currentImageUrl,
    label = 'Upload Image'
}: ImageUploaderProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setPreviewUrl(currentImageUrl || null);
    }, [currentImageUrl]);

    const { startUpload, isUploading } = useUploadThing('prizeImage', {
        headers: () => ({
            Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin-token') ?? '' : ''}`,
        }),
        onClientUploadComplete: (res) => {
            if (res?.[0]?.url) {
                setPreviewUrl(res[0].url);
                onUploadComplete(res[0].url);
                setError(null);
            }
        },
        onUploadError: (e) => {
            setError(e.message || 'Upload failed. Please try again.');
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setError('Invalid file type. Only PNG, JPG, and WebP are allowed.');
            return;
        }
        const maxSize = 4 * 1024 * 1024; // 4MB
        if (file.size > maxSize) {
            setError('File too large. Maximum size is 4MB.');
            return;
        }

        setError(null);
        startUpload([file]);
        e.target.value = '';
    };

    const handleRemove = () => {
        setPreviewUrl(null);
        setError(null);
        onUploadComplete('');
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
                {label}
            </label>

            {/* Preview */}
            {previewUrl && (
                <div className="relative w-full h-48 bg-slate-800 rounded-lg overflow-hidden group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-contain"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        Remove
                    </button>
                </div>
            )}

            {/* Upload area */}
            <label className="relative cursor-pointer block">
                <div className={`
                    px-6 py-4 rounded-lg border-2 border-dashed 
                    transition-all text-center
                    ${isUploading
                        ? 'bg-blue-500/10 border-blue-500 cursor-wait'
                        : error
                            ? 'bg-red-500/10 border-red-500'
                            : previewUrl
                                ? 'bg-slate-800 border-slate-600 hover:border-blue-500'
                                : 'bg-slate-800/50 border-slate-600 hover:border-blue-500'
                    }
                `}>
                    {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            <span className="text-sm text-blue-500 font-medium">Uploading...</span>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <div className="text-3xl">📸</div>
                            <p className="text-sm text-slate-300 font-medium">
                                {previewUrl ? 'Change Image' : 'Click to upload'}
                            </p>
                            <p className="text-xs text-slate-500">
                                PNG, JPG, WebP up to 4MB
                            </p>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                />
            </label>

            {error && (
                <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-sm text-red-400">{error}</p>
                </div>
            )}
        </div>
    );
}
