import { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { useAppStore } from '../stores/useAppStore';
import { getImageDimensions } from '../utils/imageProcessing';

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
};

export const WebcamCapture = () => {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  const setOriginalImage = useAppStore((state) => state.setOriginalImage);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const setError = useAppStore((state) => state.setError);

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

  // Capture image from webcam
  const captureImage = useCallback(async () => {
    if (!webcamRef.current) {
      setError('Webcam not available');
      return;
    }

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      
      if (!imageSrc) {
        setError('Failed to capture image');
        return;
      }

      const dimensions = await getImageDimensions(imageSrc);
      
      setOriginalImage({
        url: imageSrc,
        width: dimensions.width,
        height: dimensions.height,
      });
      
      setCurrentStep('edge-detection');
      setError(null);
    } catch (error) {
      console.error('Error capturing image:', error);
      setError('Failed to capture image');
    }
  }, [setOriginalImage, setCurrentStep, setError]);

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
        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
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
          Capture Photo
        </div>
      </button>
    </div>
  );
};

