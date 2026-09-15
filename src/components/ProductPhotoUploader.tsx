'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  Check,
  Eye,
  Sliders,
  Sun,
  Layers,
} from 'lucide-react';

export interface UploadedImageData {
  selectedUrl: string;
  originalUrl: string;
  enhancedUrl: string;
  cloudinaryPublicId: string;
}

interface ProductPhotoUploaderProps {
  initialImageUrl?: string;
  onImageChange: (data: UploadedImageData) => void;
}

export function ProductPhotoUploader({
  initialImageUrl = '',
  onImageChange,
}: ProductPhotoUploaderProps) {
  const [previewUrl, setPreviewUrl] = useState<string>(initialImageUrl);
  const [originalUrl, setOriginalUrl] = useState<string>(initialImageUrl);
  const [enhancedUrl, setEnhancedUrl] = useState<string>(initialImageUrl);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string>('');
  const [activeSelection, setActiveSelection] = useState<'enhanced' | 'original'>('enhanced');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same photo can be reselected if needed
    e.target.value = '';

    // Step 1: Immediate local preview
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setOriginalUrl(localUrl);
    setEnhancedUrl(localUrl);
    setUploadError(null);
    setUploadWarning(null);
    setIsUploading(true);

    // Step 2: Upload to Cloudinary & Apply AI Enhancement
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload photo to Cloudinary.');
        // Fallback to local image preview so artisan can still proceed
        onImageChange({
          selectedUrl: localUrl,
          originalUrl: localUrl,
          enhancedUrl: localUrl,
          cloudinaryPublicId: '',
        });
        setIsUploading(false);
        return;
      }

      const orig = data.originalImageUrl || localUrl;
      const enh = data.enhancedImageUrl || orig;
      const pubId = data.cloudinaryPublicId || '';

      setOriginalUrl(orig);
      setEnhancedUrl(enh);
      setCloudinaryPublicId(pubId);
      setActiveSelection('enhanced');
      setPreviewUrl(enh);

      if (data.warning) {
        setUploadWarning(data.warning);
      }

      onImageChange({
        selectedUrl: enh,
        originalUrl: orig,
        enhancedUrl: enh,
        cloudinaryPublicId: pubId,
      });
    } catch (err: any) {
      console.error('Image upload error:', err);
      setUploadError(`Upload error: ${err.message}. Using local preview.`);
      onImageChange({
        selectedUrl: localUrl,
        originalUrl: localUrl,
        enhancedUrl: localUrl,
        cloudinaryPublicId: '',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleChooseSelection = (choice: 'enhanced' | 'original') => {
    setActiveSelection(choice);
    const chosenUrl = choice === 'enhanced' ? enhancedUrl : originalUrl;
    setPreviewUrl(chosenUrl);

    onImageChange({
      selectedUrl: chosenUrl,
      originalUrl,
      enhancedUrl,
      cloudinaryPublicId,
    });
  };

  return (
    <div className="space-y-3">
      {/* Hidden file inputs for Camera and Gallery */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Upload Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading}
          className="py-3 px-4 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/70 hover:bg-amber-100/80 text-amber-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <Camera className="w-4 h-4 text-amber-800" />
          <span>Take Photo (Rear Camera)</span>
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isUploading}
          className="py-3 px-4 rounded-xl border-2 border-dashed border-[#E5E5E0] bg-[#FAFAF8] hover:bg-[#F2F0EB] text-[#18181B] font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4 text-[#71717A]" />
          <span>Choose from Gallery</span>
        </button>
      </div>

      {/* Uploading & AI Processing State Indicator */}
      {isUploading && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-700" />
            <div>
              <p className="font-bold">Uploading to Cloudinary &amp; Processing AI Enhancement...</p>
              <p className="text-[10px] text-amber-800">Cleaning background, balancing studio lighting &amp; optimizing clarity</p>
            </div>
          </div>
          <Sparkles className="w-4 h-4 text-amber-700 animate-pulse" />
        </div>
      )}

      {/* Warning or Error Notices */}
      {uploadWarning && (
        <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-[11px] text-sky-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-sky-700 shrink-0" />
          <span>{uploadWarning}</span>
        </div>
      )}

      {uploadError && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Photo Comparison & Selection UI */}
      {previewUrl && (
        <div className="p-3.5 rounded-2xl bg-[#FAFAF8] border border-[#E5E5E0] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-[#18181B]">
              E-Commerce Product Photography Comparison
            </span>
            <span className="text-[10px] text-[#71717A]">
              Choose which version to publish
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Version 1: Original Image Card */}
            <div
              onClick={() => handleChooseSelection('original')}
              className={`relative rounded-xl p-2 border-2 cursor-pointer transition-all ${
                activeSelection === 'original'
                  ? 'border-[#18181B] bg-white shadow-elevated'
                  : 'border-[#E5E5E0] bg-white/70 hover:border-[#71717A]'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-[#E5E5E0]/60 mb-2">
                <span className="font-bold text-[11px] text-[#18181B]">Original Photo</span>
                {activeSelection === 'original' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#18181B] text-white text-[9px] font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Selected
                  </span>
                )}
              </div>

              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-[#F2F0EB]">
                <Image
                  src={originalUrl}
                  alt="Original Photo"
                  fill
                  unoptimized={originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')}
                  className="object-cover"
                />
              </div>

              <div className="mt-2 text-[10px] text-[#71717A] space-y-0.5">
                <p>• Raw camera capture</p>
                <p>• Original natural lighting</p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChooseSelection('original');
                }}
                className={`w-full mt-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSelection === 'original'
                    ? 'bg-[#18181B] text-white'
                    : 'bg-[#FAFAF8] text-[#71717A] hover:bg-[#F2F0EB]'
                }`}
              >
                Use Original
              </button>
            </div>

            {/* Version 2: AI-Enhanced Image Card */}
            <div
              onClick={() => handleChooseSelection('enhanced')}
              className={`relative rounded-xl p-2 border-2 cursor-pointer transition-all ${
                activeSelection === 'enhanced'
                  ? 'border-amber-600 bg-amber-50/40 shadow-elevated'
                  : 'border-[#E5E5E0] bg-white/70 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60 mb-2">
                <span className="font-bold text-[11px] text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-700" />
                  AI-Enhanced
                </span>
                {activeSelection === 'enhanced' && (
                  <span className="px-1.5 py-0.5 rounded-md bg-amber-800 text-white text-[9px] font-bold flex items-center gap-0.5">
                    <Check className="w-2.5 h-2.5" /> Selected
                  </span>
                )}
              </div>

              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white border border-amber-200/60">
                <Image
                  src={enhancedUrl}
                  alt="Enhanced Photo"
                  fill
                  unoptimized={enhancedUrl.startsWith('data:') || enhancedUrl.startsWith('blob:')}
                  className="object-contain p-1"
                />
              </div>

              <div className="mt-2 text-[10px] text-emerald-800 space-y-0.5 font-medium">
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Background cleaned &amp; framed
                </p>
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Studio lighting improved
                </p>
                <p className="flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Fabric weave clarity sharpened
                </p>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleChooseSelection('enhanced');
                }}
                className={`w-full mt-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeSelection === 'enhanced'
                    ? 'bg-amber-800 hover:bg-amber-900 text-white shadow-xs'
                    : 'bg-[#FAFAF8] text-[#71717A] hover:bg-[#F2F0EB]'
                }`}
              >
                Use Enhanced
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
