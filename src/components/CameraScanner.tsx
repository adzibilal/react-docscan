import { useState, useRef, useEffect } from 'react';
import { useCamera } from '../hooks/useCamera';
import { usePolygonEditor } from '../hooks/usePolygonEditor';
import { DocumentScanner as DocScanner } from '../lib/document-scanner';
import type { Point } from '../types/opencv';

export default function CameraScanner() {
  const [cvReady, setCvReady] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [detectedPoints, setDetectedPoints] = useState<Point[]>([]);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [liveDetection, setLiveDetection] = useState(false);
  const [livePoints, setLivePoints] = useState<Point[]>([]);

  const { videoRef, isActive, error: cameraError, startCamera, stopCamera, captureImage } = useCamera();
  const imageRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const detectionIntervalRef = useRef<number | undefined>(undefined);

  // Polygon editor for adjusting detected points
  const { hoveredPointIndex, isDragging } = usePolygonEditor({
    points: detectedPoints,
    canvasRef,
    imageRef,
    onPointsChange: setDetectedPoints
  });

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

  // Draw guide overlay on video using animation frame
  useEffect(() => {
    if (!isActive) return;

    let animationFrameId: number;
    
    const drawOverlay = () => {
      const canvas = overlayCanvasRef.current;
      const video = videoRef.current;
      
      if (canvas && video && video.videoWidth > 0 && video.videoHeight > 0) {
        // Set canvas size to match video
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Calculate guide rectangle with KTP/ID Card aspect ratio (85.6mm x 53.98mm = 1.586:1)
          const ktpAspectRatio = 1.586; // KTP ratio
          const maxWidth = canvas.width * 0.85;
          const maxHeight = canvas.height * 0.6;
          
          let guideWidth, guideHeight;
          
          // Calculate dimensions based on available space while maintaining KTP ratio
          if (maxWidth / ktpAspectRatio <= maxHeight) {
            guideWidth = maxWidth;
            guideHeight = maxWidth / ktpAspectRatio;
          } else {
            guideHeight = maxHeight;
            guideWidth = maxHeight * ktpAspectRatio;
          }
          
          const guideX = (canvas.width - guideWidth) / 2;
          const guideY = (canvas.height - guideHeight) / 2;
          
          // Draw semi-transparent overlay
          ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Clear guide area
          ctx.clearRect(guideX, guideY, guideWidth, guideHeight);
          
          // Draw guide border
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 4;
          ctx.setLineDash([20, 10]);
          ctx.strokeRect(guideX, guideY, guideWidth, guideHeight);
          ctx.setLineDash([]);
          
          // Draw corners
          const cornerSize = 30;
          ctx.strokeStyle = '#00ff00';
          ctx.lineWidth = 6;
          
          // Top-left corner
          ctx.beginPath();
          ctx.moveTo(guideX + cornerSize, guideY);
          ctx.lineTo(guideX, guideY);
          ctx.lineTo(guideX, guideY + cornerSize);
          ctx.stroke();
          
          // Top-right corner
          ctx.beginPath();
          ctx.moveTo(guideX + guideWidth - cornerSize, guideY);
          ctx.lineTo(guideX + guideWidth, guideY);
          ctx.lineTo(guideX + guideWidth, guideY + cornerSize);
          ctx.stroke();
          
          // Bottom-left corner
          ctx.beginPath();
          ctx.moveTo(guideX, guideY + guideHeight - cornerSize);
          ctx.lineTo(guideX, guideY + guideHeight);
          ctx.lineTo(guideX + cornerSize, guideY + guideHeight);
          ctx.stroke();
          
          // Bottom-right corner
          ctx.beginPath();
          ctx.moveTo(guideX + guideWidth - cornerSize, guideY + guideHeight);
          ctx.lineTo(guideX + guideWidth, guideY + guideHeight);
          ctx.lineTo(guideX + guideWidth, guideY + guideHeight - cornerSize);
          ctx.stroke();
          
          // Draw live detection overlay if enabled
          if (liveDetection && livePoints.length === 4) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(livePoints[0].x, livePoints[0].y);
            for (let i = 1; i < livePoints.length; i++) {
              ctx.lineTo(livePoints[i].x, livePoints[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Draw corner points
            ctx.fillStyle = '#ff0000';
            livePoints.forEach((point) => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
          
          // Add instruction text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px Arial';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 10;
          ctx.fillText('Posisikan KTP/Dokumen dalam frame', canvas.width / 2, guideY - 20);
          
          // Add KTP icon/label at bottom
          ctx.font = '14px Arial';
          ctx.fillText('Ratio: Kartu KTP', canvas.width / 2, guideY + guideHeight + 30);
          ctx.shadowBlur = 0;
        }
      }
      
      // Continue animation loop
      animationFrameId = requestAnimationFrame(drawOverlay);
    };
    
    // Start the animation loop
    animationFrameId = requestAnimationFrame(drawOverlay);
    
    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, liveDetection, livePoints]);

  // Live detection
  useEffect(() => {
    if (liveDetection && isActive && cvReady && videoRef.current) {
      detectionIntervalRef.current = window.setInterval(() => {
        try {
          if (videoRef.current && videoRef.current.readyState === 4) {
            const scanner = new DocScanner();
            const points = scanner.detect(videoRef.current);
            if (points.length === 4) {
              setLivePoints(points);
            }
          }
        } catch (err) {
          console.error('Live detection error:', err);
        }
      }, 500); // Detect every 500ms

      return () => {
        if (detectionIntervalRef.current) {
          clearInterval(detectionIntervalRef.current);
        }
      };
    }
  }, [liveDetection, isActive, cvReady]);

  // Draw detected polygon on captured image with interactive editing
  useEffect(() => {
    if (capturedImage && detectedPoints.length === 4 && canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = imageRef.current;

      if (ctx) {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        ctx.drawImage(img, 0, 0);

        // Draw polygon
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(detectedPoints[0].x, detectedPoints[0].y);
        for (let i = 1; i < detectedPoints.length; i++) {
          ctx.lineTo(detectedPoints[i].x, detectedPoints[i].y);
        }
        ctx.closePath();
        ctx.stroke();

        // Draw corner points with hover/drag states
        detectedPoints.forEach((point, index) => {
          const isHovered = hoveredPointIndex === index;
          const radius = isHovered ? 12 : 8;
          
          // Draw outer glow for hovered point
          if (isHovered) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(point.x, point.y, radius + 6, 0, 2 * Math.PI);
            ctx.fill();
          }
          
          // Draw main point
          ctx.fillStyle = isHovered ? '#ffff00' : '#ff0000';
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, 2 * Math.PI);
          ctx.fill();
          
          // Draw white border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw number label
          ctx.fillStyle = '#ffffff';
          ctx.font = isHovered ? 'bold 18px Arial' : '16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${index + 1}`, point.x, point.y);
        });
        
        // Draw instruction text if not dragging
        if (!isDragging && hoveredPointIndex === null) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(10, 10, 280, 40);
          ctx.fillStyle = '#ffffff';
          ctx.font = '14px Arial';
          ctx.textAlign = 'left';
          ctx.fillText('💡 Drag titik merah untuk adjust', 20, 30);
        }
      }
    }
  }, [capturedImage, detectedPoints, hoveredPointIndex, isDragging]);

  const handleStartCamera = async () => {
    await startCamera();
    setCapturedImage(null);
    setDetectedPoints([]);
    setCroppedImage(null);
    setError(null);
  };

  const handleCapture = () => {
    const imageData = captureImage();
    if (imageData) {
      setCapturedImage(imageData);
      stopCamera();
      setLiveDetection(false);
    }
  };

  const handleDetect = () => {
    if (!capturedImage || !imageRef.current || !cvReady) {
      setError('Please capture an image first');
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
        setError('Could not detect document boundaries. Please try again.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during detection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCrop = () => {
    if (!capturedImage || !imageRef.current || detectedPoints.length !== 4 || !cvReady) {
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

  const handleRetake = () => {
    setCapturedImage(null);
    setDetectedPoints([]);
    setCroppedImage(null);
    setError(null);
    startCamera();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Document Scanner</h1>
              <p className="text-sm text-gray-600">Scan dokumen dengan kamera</p>
            </div>
            <div>
              {cvReady ? (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Ready
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                  Loading...
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Error Message */}
        {(error || cameraError) && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error || cameraError}
          </div>
        )}

        {/* Camera View */}
        {!capturedImage && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            {!isActive ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <svg className="mx-auto h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Mulai Scan Dokumen</h2>
                <p className="text-gray-600 mb-6">Aktifkan kamera untuk memulai scanning</p>
                <button
                  onClick={handleStartCamera}
                  disabled={!cvReady}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
                >
                  Aktifkan Kamera
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <canvas
                    ref={overlayCanvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                  />
                </div>
                
                <div className="flex flex-wrap gap-3 justify-center">
                  <button
                    onClick={handleCapture}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Capture
                  </button>
                  
                  <button
                    onClick={() => setLiveDetection(!liveDetection)}
                    className={`${
                      liveDetection ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'
                    } text-white font-semibold py-3 px-6 rounded-lg transition duration-200`}
                  >
                    {liveDetection ? 'Live Detection: ON' : 'Live Detection: OFF'}
                  </button>
                  
                  <button
                    onClick={stopCamera}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
                  >
                    Stop
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Captured Image Processing */}
        {capturedImage && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Original/Detection View */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {detectedPoints.length === 4 ? 'Detected Boundaries' : 'Captured Image'}
              </h2>
              <div className="relative mb-4">
                <img
                  ref={imageRef}
                  src={capturedImage}
                  alt="Captured"
                  className={`w-full h-auto rounded-lg ${detectedPoints.length === 4 ? 'hidden' : ''}`}
                  crossOrigin="anonymous"
                />
                {detectedPoints.length === 4 && (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto rounded-lg border-2 border-gray-300"
                    style={{ 
                      cursor: isDragging ? 'grabbing' : hoveredPointIndex !== null ? 'grab' : 'default',
                      touchAction: 'none'
                    }}
                  />
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleDetect}
                  disabled={!cvReady || isProcessing || detectedPoints.length === 4}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  {isProcessing ? 'Processing...' : detectedPoints.length === 4 ? 'Detected' : 'Detect'}
                </button>
                {detectedPoints.length === 4 && (
                  <button
                    onClick={handleCrop}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                  >
                    Crop
                  </button>
                )}
                <button
                  onClick={handleRetake}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Retake
                </button>
              </div>
            </div>

            {/* Cropped Result */}
            {croppedImage && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Scanned Document
                </h2>
                <img
                  src={croppedImage}
                  alt="Cropped"
                  className="w-full h-auto rounded-lg border-2 border-gray-300 mb-4"
                />
                <button
                  onClick={handleDownload}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

