import { useEffect, useState, useRef, useCallback } from 'react';
import { useAppStore } from '../stores/useAppStore';
import { detectDocumentEdges, applyPerspectiveTransform } from '../utils/jscanify';
import type { DetectedEdges, Corner } from '../types';

export const EdgeDetection = () => {
  const originalImage = useAppStore((state) => state.originalImage);
  const setProcessedImage = useAppStore((state) => state.setProcessedImage);
  const setDetectedEdges = useAppStore((state) => state.setDetectedEdges);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const setProcessing = useAppStore((state) => state.setProcessing);
  const setError = useAppStore((state) => state.setError);
  const opencvReady = useAppStore((state) => state.opencvReady);

  const [edges, setEdges] = useState<DetectedEdges | null>(null);
  const [selectedCorner, setSelectedCorner] = useState<keyof DetectedEdges | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset image loaded state when image changes
  useEffect(() => {
    setImageLoaded(false);
  }, [originalImage]);

  // Detect edges when component mounts
  useEffect(() => {
    if (!originalImage) return;

    const detectEdges = async () => {
      // If OpenCV is not ready, set default corners
      if (!opencvReady) {
        console.warn('OpenCV not ready, using default corners');
        setEdges({
          topLeft: { x: 0, y: 0 },
          topRight: { x: originalImage.width, y: 0 },
          bottomLeft: { x: 0, y: originalImage.height },
          bottomRight: { x: originalImage.width, y: originalImage.height },
        });
        setError('Edge detection unavailable. Please adjust corners manually.');
        return;
      }

      setProcessing(true);
      try {
        const detectedEdges = await detectDocumentEdges(originalImage.url);
        if (detectedEdges) {
          setEdges(detectedEdges);
          setDetectedEdges(detectedEdges);
          setError(null);
        } else {
          setError('Could not detect document edges. Please adjust manually.');
          // Set default corners
          setEdges({
            topLeft: { x: 0, y: 0 },
            topRight: { x: originalImage.width, y: 0 },
            bottomLeft: { x: 0, y: originalImage.height },
            bottomRight: { x: originalImage.width, y: originalImage.height },
          });
        }
      } catch (error) {
        console.error('Error detecting edges:', error);
        setError('Failed to detect edges. Please adjust corners manually.');
        // Set default corners on error
        setEdges({
          topLeft: { x: 0, y: 0 },
          topRight: { x: originalImage.width, y: 0 },
          bottomLeft: { x: 0, y: originalImage.height },
          bottomRight: { x: originalImage.width, y: originalImage.height },
        });
      } finally {
        setProcessing(false);
      }
    };

    detectEdges();
  }, [originalImage, opencvReady, setDetectedEdges, setProcessing, setError]);

  // Draw edges on canvas (redraw when selectedCorner changes for visual feedback)
  useEffect(() => {
    if (!edges || !canvasRef.current || !imageRef.current || !imageLoaded) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx || !img.naturalWidth || !img.naturalHeight) {
      console.log('Canvas context or image dimensions not ready');
      return;
    }

    // Calculate scale to fit container
    const containerWidth = canvas.parentElement?.clientWidth || 800;
    const scale = Math.min(containerWidth / img.naturalWidth, 1);
    setImageScale(scale);

    canvas.width = img.naturalWidth * scale;
    canvas.height = img.naturalHeight * scale;

    // Draw image
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Draw edges
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.fillStyle = '#3B82F6';

    const scaledEdges = {
      topLeft: { x: edges.topLeft.x * scale, y: edges.topLeft.y * scale },
      topRight: { x: edges.topRight.x * scale, y: edges.topRight.y * scale },
      bottomRight: { x: edges.bottomRight.x * scale, y: edges.bottomRight.y * scale },
      bottomLeft: { x: edges.bottomLeft.x * scale, y: edges.bottomLeft.y * scale },
    };

    // Draw lines
    ctx.beginPath();
    ctx.moveTo(scaledEdges.topLeft.x, scaledEdges.topLeft.y);
    ctx.lineTo(scaledEdges.topRight.x, scaledEdges.topRight.y);
    ctx.lineTo(scaledEdges.bottomRight.x, scaledEdges.bottomRight.y);
    ctx.lineTo(scaledEdges.bottomLeft.x, scaledEdges.bottomLeft.y);
    ctx.closePath();
    ctx.stroke();

    // Draw corner handles (larger for mobile)
    const drawCorner = (corner: Corner, label: string, cornerKey: keyof DetectedEdges) => {
      const isSelected = selectedCorner === cornerKey;
      const radius = isSelected ? 14 : 12; // Larger radius for better touch targets
      
      // Outer glow for selected corner
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(corner.x, corner.y, radius + 4, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.fill();
      }
      
      // Main circle
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = isSelected ? '#2563EB' : '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#1E40AF';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(label, corner.x + 16, corner.y - 10);
    };

    drawCorner(scaledEdges.topLeft, 'TL', 'topLeft');
    drawCorner(scaledEdges.topRight, 'TR', 'topRight');
    drawCorner(scaledEdges.bottomRight, 'BR', 'bottomRight');
    drawCorner(scaledEdges.bottomLeft, 'BL', 'bottomLeft');
  }, [edges, selectedCorner, imageLoaded]); // Redraw when image loaded or selected corner changes

  // Handle corner selection (mouse & touch)
  const handlePointerDown = useCallback((clientX: number, clientY: number) => {
    if (!edges || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / imageScale;
    const y = (clientY - rect.top) / imageScale;

    // Larger threshold for touch (finger is bigger than mouse cursor)
    const threshold = 35;
    const corners: (keyof DetectedEdges)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    
    for (const cornerKey of corners) {
      const corner = edges[cornerKey];
      const distance = Math.sqrt(Math.pow(corner.x - x, 2) + Math.pow(corner.y - y, 2));
      if (distance < threshold) {
        setSelectedCorner(cornerKey);
        break;
      }
    }
  }, [edges, imageScale]);

  // Handle corner dragging (mouse & touch)
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    if (!selectedCorner || !edges || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) / imageScale;
    const y = (clientY - rect.top) / imageScale;

    setEdges({
      ...edges,
      [selectedCorner]: { x, y },
    });
  }, [selectedCorner, edges, imageScale]);

  // Handle end of dragging
  const handlePointerUp = useCallback(() => {
    setSelectedCorner(null);
  }, []);

  // Mouse event handlers
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerDown(event.clientX, event.clientY);
  }, [handlePointerDown]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    handlePointerMove(event.clientX, event.clientY);
  }, [handlePointerMove]);

  const handleMouseUp = useCallback(() => {
    handlePointerUp();
  }, [handlePointerUp]);

  // Touch event handlers
  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevent scrolling
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      handlePointerDown(touch.clientX, touch.clientY);
    }
  }, [handlePointerDown]);

  const handleTouchMove = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault(); // Prevent scrolling
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    }
  }, [handlePointerMove]);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    handlePointerUp();
  }, [handlePointerUp]);

  // Apply perspective transform
  const handleApplyTransform = useCallback(async () => {
    if (!originalImage || !edges) return;

    setProcessing(true);
    try {
      // If OpenCV is available, use perspective transform
      if (opencvReady) {
        const transformedUrl = await applyPerspectiveTransform(originalImage.url, edges);
        
        const img = new Image();
        img.onload = () => {
          setProcessedImage({
            url: transformedUrl,
            originalUrl: originalImage.url,
            width: img.width,
            height: img.height,
          });
          setDetectedEdges(edges);
          setCurrentStep('edit');
          setError(null);
        };
        img.src = transformedUrl;
      } else {
        // If OpenCV is not available, just pass the original image
        console.warn('OpenCV not available, skipping perspective transform');
        setProcessedImage({
          url: originalImage.url,
          originalUrl: originalImage.url,
          width: originalImage.width,
          height: originalImage.height,
        });
        setCurrentStep('edit');
        setError('Perspective correction unavailable. Proceeding with original image.');
      }
    } catch (error) {
      console.error('Error applying transform:', error);
      // Fallback to original image on error
      setProcessedImage({
        url: originalImage.url,
        originalUrl: originalImage.url,
        width: originalImage.width,
        height: originalImage.height,
      });
      setCurrentStep('edit');
      setError('Failed to apply perspective correction. Using original image.');
    } finally {
      setProcessing(false);
    }
  }, [originalImage, edges, opencvReady, setProcessedImage, setDetectedEdges, setCurrentStep, setError, setProcessing]);

  // Skip edge detection
  const handleSkip = useCallback(() => {
    if (!originalImage) return;
    
    setProcessedImage({
      url: originalImage.url,
      originalUrl: originalImage.url,
      width: originalImage.width,
      height: originalImage.height,
    });
    setCurrentStep('edit');
  }, [originalImage, setProcessedImage, setCurrentStep]);

  if (!originalImage) {
    return (
      <div className="text-center text-gray-500">
        No image loaded. Please capture or upload an image first.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center px-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Adjust Document Edges
        </h2>
        <p className="text-gray-600 mb-2">
          Tap and drag the corner points to match your document edges
        </p>
        <p className="text-sm text-gray-500">
          Touch and hold each blue circle to move it
        </p>
        {selectedCorner && (
          <div className="mt-3 inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">
              Moving: {selectedCorner.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          </div>
        )}
      </div>

      <div className="relative w-full max-w-3xl">
        <img
          ref={imageRef}
          src={originalImage.url}
          alt="Original"
          onLoad={() => {
            console.log('Image loaded successfully');
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.error('Image failed to load', e);
            setError('Failed to load image for edge detection');
          }}
          className="hidden"
        />
        {!imageLoaded && (
          <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading image...</p>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`w-full h-auto rounded-lg shadow-lg cursor-crosshair touch-none ${!imageLoaded ? 'hidden' : ''}`}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md px-4">
        <button
          onClick={handleSkip}
          className="w-full sm:w-auto px-6 py-3 bg-gray-500 hover:bg-gray-600 active:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleApplyTransform}
          disabled={!edges}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-lg"
        >
          Apply Correction
        </button>
      </div>
    </div>
  );
};

