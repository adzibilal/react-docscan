import { useState, useRef, useEffect } from 'react';
import { DocumentScanner as DocScanner } from '../lib/document-scanner';
import type { Point } from '../types/opencv';

export default function DocumentScanner() {
  const [cvReady, setCvReady] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedPoints, setDetectedPoints] = useState<Point[]>([]);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Listen for OpenCV ready event
  useEffect(() => {
    if (window.cvReady) {
      setCvReady(true);
    } else {
      const handleCvReady = () => setCvReady(true);
      window.addEventListener('opencv-ready', handleCvReady);
      return () => window.removeEventListener('opencv-ready', handleCvReady);
    }
  }, []);

  // Draw detected polygon on canvas
  useEffect(() => {
    if (selectedImage && detectedPoints.length === 4 && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;

      if (ctx) {
        // Set canvas size to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw the image
        ctx.drawImage(img, 0, 0);

        // Draw the polygon
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(detectedPoints[0].x, detectedPoints[0].y);
        for (let i = 1; i < detectedPoints.length; i++) {
          ctx.lineTo(detectedPoints[i].x, detectedPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw corner points
        ctx.fillStyle = '#ff0000';
        detectedPoints.forEach((point, index) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
          ctx.fill();
          
          // Label the points
          ctx.fillStyle = '#ffffff';
          ctx.font = '16px Arial';
          ctx.fillText(`${index + 1}`, point.x - 5, point.y + 5);
          ctx.fillStyle = '#ff0000';
        });
      }
    }
  }, [selectedImage, detectedPoints]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setSelectedImage(dataUrl);
        setDetectedPoints([]);
        setCroppedImage(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDetect = () => {
    if (!selectedImage || !imageRef.current || !cvReady) {
      setError('Please select an image and wait for OpenCV to load');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const scanner = new DocScanner();
      const points = scanner.detect(imageRef.current);
      
      if (points.length === 4) {
        setDetectedPoints(points);
      } else {
        setError('Could not detect document boundaries. Please try a different image.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during detection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = () => {
    if (!selectedImage || !imageRef.current || detectedPoints.length !== 4 || !cvReady) {
      setError('Please detect the document first');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const scanner = new DocScanner();
      const croppedDataUrl = scanner.warp(imageRef.current, detectedPoints);
      setCroppedImage(croppedDataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during cropping');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setDetectedPoints([]);
    setCroppedImage(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = () => {
    if (croppedImage) {
      const link = document.createElement('a');
      link.download = 'scanned-document.png';
      link.href = croppedImage;
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Document Scanner
          </h1>
          <p className="text-gray-600">
            Upload an image to detect and crop document boundaries using OpenCV.js
          </p>
          <div className="mt-4">
            {cvReady ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                OpenCV Ready
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                Loading OpenCV...
              </span>
            )}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
            >
              Choose Image
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Supported formats: JPG, PNG, etc.
            </p>
          </div>

          {/* Action Buttons */}
          {selectedImage && (
            <div className="flex flex-wrap justify-center gap-3 mt-6">
              <button
                onClick={handleDetect}
                disabled={!cvReady || isProcessing}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                {isProcessing ? 'Processing...' : 'Detect Document'}
              </button>
              {detectedPoints.length === 4 && (
                <button
                  onClick={handleCrop}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                >
                  Crop Document
                </button>
              )}
              {croppedImage && (
                <button
                  onClick={handleDownload}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
                >
                  Download
                </button>
              )}
              <button
                onClick={handleReset}
                className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200"
              >
                Reset
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Image Display */}
        {selectedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original/Detection View */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {detectedPoints.length === 4 ? 'Detected Boundaries' : 'Original Image'}
              </h2>
              <div className="relative">
                <img
                  ref={imageRef}
                  src={selectedImage}
                  alt="Selected"
                  className={`w-full h-auto rounded-lg ${detectedPoints.length === 4 ? 'hidden' : ''}`}
                  crossOrigin="anonymous"
                />
                {detectedPoints.length === 4 && (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto rounded-lg border-2 border-gray-300"
                  />
                )}
              </div>
            </div>

            {/* Cropped Result */}
            {croppedImage && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Cropped Document
                </h2>
                <img
                  src={croppedImage}
                  alt="Cropped"
                  className="w-full h-auto rounded-lg border-2 border-gray-300"
                />
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        {!selectedImage && (
          <div className="bg-white rounded-lg shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">How to Use</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Click "Choose Image" to upload a photo of a document</li>
              <li>Click "Detect Document" to automatically find the document boundaries</li>
              <li>Review the detected corners (shown as red dots with green outline)</li>
              <li>Click "Crop Document" to apply perspective correction</li>
              <li>Download your scanned document</li>
            </ol>
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> For best results, use images with good lighting and clear contrast 
                between the document and background. White documents on dark backgrounds work best.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

