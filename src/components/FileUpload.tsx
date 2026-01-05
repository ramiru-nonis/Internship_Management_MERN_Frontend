'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    maxSize?: number; // in MB
    label?: string;
    currentFile?: string;
}

export default function FileUpload({
    onFileSelect,
    accept = '.pdf,.jpg,.jpeg,.png',
    maxSize = 5,
    label = 'Upload File',
    currentFile
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const validateFile = (file: File): boolean => {
        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
            setError(`File size must be less than ${maxSize}MB`);
            return false;
        }

        // Check file type
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        const acceptedTypes = accept.split(',').map(type => type.trim());

        if (!acceptedTypes.includes(fileExtension)) {
            setError(`File type must be one of: ${accept}`);
            return false;
        }

        setError('');
        return true;
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (validateFile(file)) {
                setSelectedFile(file);
                onFileSelect(file);
            }
        }
    };

    const handleRemove = () => {
        setSelectedFile(null);
        setError('');
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label}
            </label>

            {!selectedFile && !currentFile ? (
                <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${dragActive
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        className="hidden"
                        accept={accept}
                        onChange={handleChange}
                    />

                    <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => inputRef.current?.click()}
                                className="text-blue-600 hover:text-blue-700 font-medium"
                            >
                                Click to upload
                            </button>
                            <span className="text-gray-500"> or drag and drop</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {accept.toUpperCase()} up to {maxSize}MB
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                {selectedFile?.name || currentFile?.split('/').pop()}
                            </p>
                            <p className="text-xs text-gray-500">
                                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Current file'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="text-red-600 hover:text-red-700"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
}
