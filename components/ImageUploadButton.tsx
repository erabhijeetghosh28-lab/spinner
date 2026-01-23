'use client';

import React, { useState } from 'react';
import { UploadButton } from '@uploadthing/react';
import type { OurFileRouter } from '@/app/api/uploadthing/core';

interface ImageUploadButtonProps {
  onUploadComplete: (url: string) => void;
  onUploadError?: (error: Error) => void;
  currentImageUrl?: string | null;
  disabled?: boolean;
}

export default function ImageUploadButton({
  onUploadComplete,
  onUploadError,
  currentImageUrl,
  disabled = false
}: ImageUploadButtonProps) {
  const [uploading, setUploading] = useState(false);

  return (
    <div className="flex items-center space-x-3">
      {/* Current Image Preview */}
      {currentImageUrl && (
        <div className="relative">
          <img 
            src={currentImageUrl} 
            alt="Current prize image" 
            className="w-16 h-16 rounded-lg object-cover border-2 border-amber-500/50"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>
      )}

      {/* Upload Button */}
      <UploadButton<OurFileRouter, "prizeImage">
        endpoint="prizeImage"
        onClientUploadComplete={(res) => {
          if (res && res[0]?.url) {
            setUploading(false);
            onUploadComplete(res[0].url);
          }
        }}
        onUploadError={(error: Error) => {
          setUploading(false);
          console.error('Upload error:', error);
          onUploadError?.(error);
          alert('Failed to upload image: ' + error.message);
        }}
        onUploadBegin={() => {
          setUploading(true);
        }}
        className="ut-button:bg-amber-500 ut-button:hover:bg-amber-400 ut-button:ut-readying:bg-amber-500/50 ut-allowed-content:text-slate-400 ut-label:text-white ut-label:font-bold"
        disabled={disabled || uploading}
      />

      {/* Manual URL Input Fallback */}
      <div className="flex-1">
        <input
          type="url"
          placeholder="Or paste image URL"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
          onBlur={(e) => {
            const url = e.target.value.trim();
            if (url && url.startsWith('http')) {
              onUploadComplete(url);
            }
          }}
          disabled={disabled || uploading}
        />
      </div>
    </div>
  );
}
