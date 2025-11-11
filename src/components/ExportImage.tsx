import { useState, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { exportImage, downloadImage } from '../utils/imageProcessing';
import type { ExportFormat } from '../types';

export const ExportImage = () => {
  const processedImage = useAppStore((state) => state.processedImage);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const reset = useAppStore((state) => state.reset);
  const setProcessing = useAppStore((state) => state.setProcessing);
  const setError = useAppStore((state) => state.setError);

  const [format, setFormat] = useState<ExportFormat>('image/jpeg');
  const [quality, setQuality] = useState(0.95);
  const [filename, setFilename] = useState('document-scan');

  // Handle export
  const handleExport = useCallback(async () => {
    if (!processedImage) return;

    setProcessing(true);
    try {
      const exportedUrl = await exportImage(processedImage.url, {
        format,
        quality,
        filename,
      });

      const extension = format === 'image/jpeg' ? 'jpg' : 'png';
      downloadImage(exportedUrl, `${filename}.${extension}`);
      
      setError(null);
    } catch (error) {
      console.error('Error exporting image:', error);
      setError('Failed to export image');
    } finally {
      setProcessing(false);
    }
  }, [processedImage, format, quality, filename, setProcessing, setError]);

  // Start new scan
  const handleNewScan = useCallback(() => {
    reset();
  }, [reset]);

  if (!processedImage) {
    return (
      <div className="text-center text-gray-500">
        No processed image available. Please go back and process an image first.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Export Document
        </h2>
        <p className="text-gray-600">
          Review and download your scanned document
        </p>
      </div>

      {/* Preview */}
      <div className="w-full max-w-3xl">
        <img
          src={processedImage.url}
          alt="Final document"
          className="w-full h-auto rounded-lg shadow-lg"
        />
      </div>

      {/* Export options */}
      <div className="w-full max-w-md space-y-6 bg-white p-6 rounded-lg shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="document-scan"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Format
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setFormat('image/jpeg')}
              className={`px-4 py-3 font-medium rounded-lg transition-all ${
                format === 'image/jpeg'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg">JPG</span>
                <span className="text-xs opacity-75">Smaller size</span>
              </div>
            </button>
            <button
              onClick={() => setFormat('image/png')}
              className={`px-4 py-3 font-medium rounded-lg transition-all ${
                format === 'image/png'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex flex-col items-center">
                <span className="text-lg">PNG</span>
                <span className="text-xs opacity-75">Better quality</span>
              </div>
            </button>
          </div>
        </div>

        {format === 'image/jpeg' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>
        )}

        <div className="pt-4 space-y-3">
          <button
            onClick={handleExport}
            className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download Image
          </button>

          <button
            onClick={handleNewScan}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
          >
            Start New Scan
          </button>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => setCurrentStep('edit')}
        className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
      >
        Back to Edit
      </button>

      {/* Info */}
      <div className="text-center text-sm text-gray-500 max-w-md">
        <p>
          <strong>Document Info:</strong><br />
          Size: {processedImage.width} × {processedImage.height}px
        </p>
      </div>
    </div>
  );
};

