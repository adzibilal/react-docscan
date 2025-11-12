import { useRef, useState, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { useAppStore } from '../stores/useAppStore';
import { getImageDimensions } from '../utils/imageProcessing';
import { useRealtimeDocumentDetection } from '../hooks/useRealtimeDocumentDetection';
import { applyPerspectiveTransform } from '../utils/jscanify';
import type { DetectedEdges } from '../types';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
};

export const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  const setOriginalImage = useAppStore((state) => state.setOriginalImage);
  const setProcessedImage = useAppStore((state) => state.setProcessedImage);
  const setDetectedEdges = useAppStore((state) => state.setDetectedEdges);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const setError = useAppStore((state) => state.setError);
  const setProcessing = useAppStore((state) => state.setProcessing);
  const opencvReady = useAppStore((state) => state.opencvReady);

  // Get video element ref from webcam
  useEffect(() => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      if (video) {
        videoRef.current = video;
      }
    }
  }, [webcamRef.current]);

  // Use real-time document detection
  const { detectedEdges } = useRealtimeDocumentDetection({
    videoRef,
    enabled: true,
    opencvReady,
  });

  // Check for multiple cameras
  const checkCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
    } catch (error) {
      console.error('Error checking cameras:', error);
    }
  }, []);

  // Draw detected edges on overlay canvas
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current || !detectedEdges) {
      return;
    }

    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Match canvas size to video display size
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Calculate scale factors
    const scaleX = rect.width / video.videoWidth;
    const scaleY = rect.height / video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale detected edges to canvas size
    const scaledEdges = {
      topLeft: { x: detectedEdges.topLeft.x * scaleX, y: detectedEdges.topLeft.y * scaleY },
      topRight: { x: detectedEdges.topRight.x * scaleX, y: detectedEdges.topRight.y * scaleY },
      bottomRight: { x: detectedEdges.bottomRight.x * scaleX, y: detectedEdges.bottomRight.y * scaleY },
      bottomLeft: { x: detectedEdges.bottomLeft.x * scaleX, y: detectedEdges.bottomLeft.y * scaleY },
    };

    // Draw semi-transparent filled area
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.beginPath();
    ctx.moveTo(scaledEdges.topLeft.x, scaledEdges.topLeft.y);
    ctx.lineTo(scaledEdges.topRight.x, scaledEdges.topRight.y);
    ctx.lineTo(scaledEdges.bottomRight.x, scaledEdges.bottomRight.y);
    ctx.lineTo(scaledEdges.bottomLeft.x, scaledEdges.bottomLeft.y);
    ctx.closePath();
    ctx.fill();

    // Draw green border lines (like Python version)
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(scaledEdges.topLeft.x, scaledEdges.topLeft.y);
    ctx.lineTo(scaledEdges.topRight.x, scaledEdges.topRight.y);
    ctx.lineTo(scaledEdges.bottomRight.x, scaledEdges.bottomRight.y);
    ctx.lineTo(scaledEdges.bottomLeft.x, scaledEdges.bottomLeft.y);
    ctx.closePath();
    ctx.stroke();

    // Draw corner circles
    const drawCorner = (x: number, y: number) => {
      // Outer glow
      ctx.beginPath();
      ctx.arc(x, y, 18, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(x, y, 12, 0, 2 * Math.PI);
      ctx.fillStyle = '#00FF00';
      ctx.fill();
      
      // White outline
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.stroke();
    };

    drawCorner(scaledEdges.topLeft.x, scaledEdges.topLeft.y);
    drawCorner(scaledEdges.topRight.x, scaledEdges.topRight.y);
    drawCorner(scaledEdges.bottomRight.x, scaledEdges.bottomRight.y);
    drawCorner(scaledEdges.bottomLeft.x, scaledEdges.bottomLeft.y);
  }, [detectedEdges]);

  // Capture image from webcam with perspective transform
  const captureImage = useCallback(async () => {
    if (!webcamRef.current) {
      setError('Webcam not available');
      return;
    }

    setProcessing(true);
    
    try {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        setError('Failed to capture image');
        setProcessing(false);
        return;
      }

      const dimensions = await getImageDimensions(imageSrc);
      
      // Save original image
      setOriginalImage({
        url: imageSrc,
        width: dimensions.width,
        height: dimensions.height,
      });

      // If we have detected edges and OpenCV is ready, apply perspective transform immediately
      if (detectedEdges && opencvReady) {
        try {
          const transformedUrl = await applyPerspectiveTransform(imageSrc, detectedEdges);
          const transformedDimensions = await getImageDimensions(transformedUrl);
          
          // Set processed image and skip to edit step
          setProcessedImage({
            url: transformedUrl,
            originalUrl: imageSrc,
            width: transformedDimensions.width,
            height: transformedDimensions.height,
          });
          setDetectedEdges(detectedEdges);
          setCurrentStep('edit');
          setError(null);
        } catch (error) {
          console.error('Error applying perspective transform:', error);
          // Fallback to edge-detection step if transform fails
          setCurrentStep('edge-detection');
        }
      } else {
        // No edges detected or OpenCV not ready, go to edge-detection step
        setCurrentStep('edge-detection');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image');
    } finally {
      setProcessing(false);
    }
  }, [detectedEdges, opencvReady, setOriginalImage, setProcessedImage, setDetectedEdges, setCurrentStep, setError, setProcessing]);

  // Toggle camera
  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="relative w-full max-w-3xl aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={{
            ...videoConstraints,
            facingMode,
          }}
          className="w-full h-full object-cover"
          onUserMedia={checkCameras}
        />
        
        {/* Overlay canvas for drawing detected edges */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
        
        {/* Document detected indicator */}
        {detectedEdges && (
          <div className="absolute top-4 left-4 px-4 py-2 bg-green-500 text-white rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">Document Detected</span>
          </div>
        )}
        
        {/* Camera switch button */}
        {hasMultipleCameras && (
          <button
            onClick={toggleCamera}
            className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            title="Switch camera"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Capture button */}
      <button
        onClick={captureImage}
        className={`px-8 py-4 font-semibold rounded-lg transition-all shadow-lg ${
          detectedEdges
            ? 'bg-green-600 hover:bg-green-700 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        } text-white`}
      >
        <div className="flex items-center gap-2">
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
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {detectedEdges ? 'Capture Document' : 'Capture Photo'}
        </div>
      </button>
    </div>
  );
};

