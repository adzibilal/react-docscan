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

  // Draw edges on canvas
  useEffect(() => {
    if (!edges || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!ctx) return;

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

    // Draw corner handles
    const drawCorner = (corner: Corner, label: string) => {
      ctx.beginPath();
      ctx.arc(corner.x, corner.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = '#3B82F6';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw label
      ctx.fillStyle = '#1E40AF';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(label, corner.x + 12, corner.y - 8);
    };

    drawCorner(scaledEdges.topLeft, 'TL');
    drawCorner(scaledEdges.topRight, 'TR');
    drawCorner(scaledEdges.bottomRight, 'BR');
    drawCorner(scaledEdges.bottomLeft, 'BL');
  }, [edges]);

  // Handle corner dragging
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!edges || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / imageScale;
    const y = (event.clientY - rect.top) / imageScale;

    // Check which corner is clicked
    const threshold = 20;
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

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedCorner || !edges || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / imageScale;
    const y = (event.clientY - rect.top) / imageScale;

    setEdges({
      ...edges,
      [selectedCorner]: { x, y },
    });
  }, [selectedCorner, edges, imageScale]);

  const handleMouseUp = useCallback(() => {
    setSelectedCorner(null);
  }, []);

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
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Adjust Document Edges
        </h2>
        <p className="text-gray-600">
          Drag the corner points to match your document edges
        </p>
      </div>

      <div className="relative w-full max-w-3xl">
        <img
          ref={imageRef}
          src={originalImage.url}
          alt="Original"
          className="hidden"
        />
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="w-full h-auto rounded-lg shadow-lg cursor-crosshair"
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleSkip}
          className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
        >
          Skip
        </button>
        <button
          onClick={handleApplyTransform}
          disabled={!edges}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors shadow-lg"
        >
          Apply Correction
        </button>
      </div>
    </div>
  );
};

