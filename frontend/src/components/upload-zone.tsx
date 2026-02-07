'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
    value: File[];
    onChange: (files: File[]) => void;
    maxFiles?: number;
    error?: string;
}

export function UploadZone({ value, onChange, maxFiles = 4, error }: UploadZoneProps) {
    const [previews, setPreviews] = useState<string[]>([]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = [...value, ...acceptedFiles].slice(0, maxFiles);
            onChange(newFiles);

            // Generate previews
            const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
            setPreviews(newPreviews);
        },
        [value, onChange, maxFiles]
    );

    const removeFile = (index: number) => {
        const newFiles = value.filter((_, i) => i !== index);
        onChange(newFiles);

        // Update previews
        URL.revokeObjectURL(previews[index]);
        setPreviews(previews.filter((_, i) => i !== index));
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        },
        maxFiles: maxFiles - value.length,
        maxSize: 10 * 1024 * 1024, // 10MB
    });

    return (
        <div className="space-y-4">
            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={cn(
                    'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                    isDragActive
                        ? 'border-teal-500 bg-teal-500/10'
                        : 'border-gray-300 hover:border-teal-400 hover:bg-gray-50',
                    error && 'border-red-500 bg-red-50'
                )}
            >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-3">
                    <div className={cn(
                        'w-16 h-16 rounded-full flex items-center justify-center',
                        isDragActive ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-400'
                    )}>
                        <Upload className="w-8 h-8" />
                    </div>

                    <div>
                        <p className="text-lg font-medium text-gray-700">
                            {isDragActive ? 'Drop your images here' : 'Drag & drop damage photos'}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            or click to browse • 1-4 images • JPG, PNG, WebP • Max 10MB each
                        </p>
                    </div>

                    {/* Mobile camera hint */}
                    <p className="text-xs text-gray-400 md:hidden">
                        📷 You can take photos directly on mobile
                    </p>
                </div>
            </div>

            {error && (
                <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Image Previews */}
            {previews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {previews.map((preview, index) => (
                        <div
                            key={preview}
                            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
                        >
                            <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>

                            {/* Image number */}
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                                {index + 1} / {previews.length}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload count */}
            {value.length > 0 && (
                <p className="text-sm text-gray-500 text-center">
                    {value.length} of {maxFiles} images uploaded
                </p>
            )}
        </div>
    );
}
