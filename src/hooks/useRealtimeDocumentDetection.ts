import { useEffect, useState, useCallback, useRef } from 'react';
import type { DetectedEdges } from '../types/index';

interface UseRealtimeDocumentDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  enabled: boolean;
  opencvReady: boolean;
}

export const useRealtimeDocumentDetection = ({
  videoRef,
  enabled,
  opencvReady,
}: UseRealtimeDocumentDetectionOptions) => {
  const [detectedEdges, setDetectedEdges] = useState<DetectedEdges | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastProcessTimeRef = useRef<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scannerRef = useRef<any>(null);

  // Initialize scanner instance once
  useEffect(() => {
    if (opencvReady && typeof window !== 'undefined' && window.jscanify) {
      try {
        scannerRef.current = new window.jscanify();
        console.log('jscanify scanner initialized for real-time detection');
      } catch (error) {
        console.error('Error initializing jscanify:', error);
      }
    }
    return () => {
      scannerRef.current = null;
    };
  }, [opencvReady]);

  const detectDocumentInFrame = useCallback(() => {
    if (!enabled || !opencvReady || !videoRef.current || !scannerRef.current) {
      return;
    }

    const video = videoRef.current;
    
    // Check if video is ready
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    // Throttle to ~10-15 FPS (process every 66-100ms)
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessTimeRef.current;
    if (timeSinceLastProcess < 100) {
      return;
    }
    lastProcessTimeRef.current = now;

    let mat = null;
    let contour = null;

    try {
      setIsDetecting(true);

      // Create canvas if not exists
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }

      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current video frame to canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert canvas to OpenCV Mat
      mat = window.cv.imread(canvas);

      // Find paper contour
      contour = scannerRef.current.findPaperContour(mat);

      if (contour) {
        // Get corner points from contour
        const cornerPoints = scannerRef.current.getCornerPoints(contour);

        if (
          cornerPoints.topLeftCorner &&
          cornerPoints.topRightCorner &&
          cornerPoints.bottomLeftCorner &&
          cornerPoints.bottomRightCorner
        ) {
          const edges: DetectedEdges = {
            topLeft: cornerPoints.topLeftCorner,
            topRight: cornerPoints.topRightCorner,
            bottomLeft: cornerPoints.bottomLeftCorner,
            bottomRight: cornerPoints.bottomRightCorner,
          };

          setDetectedEdges(edges);
        } else {
          // No valid corners detected
          setDetectedEdges(null);
        }
      } else {
        // No contour detected
        setDetectedEdges(null);
      }
    } catch (error) {
      console.error('Error in real-time document detection:', error);
      setDetectedEdges(null);
    } finally {
      // Clean up OpenCV objects to prevent memory leaks
      if (mat) {
        try {
          mat.delete();
        } catch (e) {
          console.warn('Error deleting mat:', e);
        }
      }
      if (contour) {
        try {
          contour.delete();
        } catch (e) {
          console.warn('Error deleting contour:', e);
        }
      }
      setIsDetecting(false);
    }
  }, [enabled, opencvReady, videoRef]);

  // Animation loop
  useEffect(() => {
    if (!enabled || !opencvReady) {
      return;
    }

    const processFrame = () => {
      detectDocumentInFrame();
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    // Start the detection loop
    animationFrameRef.current = requestAnimationFrame(processFrame);

    // Cleanup on unmount or when disabled
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      // Clean up canvas
      if (canvasRef.current) {
        canvasRef.current = null;
      }
    };
  }, [enabled, opencvReady, detectDocumentInFrame]);

  return {
    detectedEdges,
    isDetecting,
  };
};

