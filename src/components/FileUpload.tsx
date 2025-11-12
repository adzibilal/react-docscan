import { useCallback, useState } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { fileToDataURL, getImageDimensions, validateImageFile } from '../utils/imageProcessing';

export const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const setOriginalImage = useAppStore((state) => state.setOriginalImage);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const setError = useAppStore((state) => state.setError);

  const processFile = useCallback(async (file: File) => {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    try {
      const dataUrl = await fileToDataURL(file);
      const dimensions = await getImageDimensions(dataUrl);
      
      setPreviewUrl(dataUrl);
      setOriginalImage({
        url: dataUrl,
        file,
        width: dimensions.width,
        height: dimensions.height,
      });
      
      // Auto-advance to edge detection after a short delay
      setTimeout(() => {
        setCurrentStep('edge-detection');
      }, 500);
      
      setError(null);
    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process image file');
    }
  }, [setOriginalImage, setCurrentStep, setError]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {previewUrl ? (
        <div className="relative w-full max-w-3xl">
          <img
            src={previewUrl}
            alt="Uploaded preview"
            className="w-full h-auto rounded-lg shadow-lg"
          />
          <div className="absolute inset-0 bg-green-500/20 rounded-lg flex items-center justify-center pointer-events-none">
            <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold animate-pulse">
              ✓ Image loaded - Processing...
            </div>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-full max-w-3xl aspect-video
            border-4 border-dashed rounded-lg
            flex flex-col items-center justify-center gap-4
            transition-all cursor-pointer
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/50'
            }
          `}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-16 w-16 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-700">
              {isDragging ? 'Drop image here' : 'Drag & drop your image here'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: JPG, PNG, HEIC (Max 50MB)
            </p>
          </div>

          <label className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors cursor-pointer">
            Choose File
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
};

