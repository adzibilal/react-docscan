import type { DetectedEdges } from '../types';

// Declare jscanify types
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jscanify: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any;
  }
}

// Check if jscanify and OpenCV are loaded
export const isOpenCVReady = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.cv !== 'undefined' && 
         typeof window.jscanify !== 'undefined';
};

// Wait for OpenCV and jscanify to load
export const waitForOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isOpenCVReady()) {
      console.log('OpenCV and jscanify already loaded');
      resolve();
      return;
    }

    let attempts = 0;
    const maxAttempts = 300; // 30 seconds

    const checkInterval = setInterval(() => {
      attempts++;

      // Log what we're waiting for
      const cvReady = typeof window !== 'undefined' && typeof window.cv !== 'undefined';
      const jscanifyReady = typeof window !== 'undefined' && typeof window.jscanify !== 'undefined';
      
      if (!cvReady) {
        console.log('Waiting for OpenCV...');
      }
      if (!jscanifyReady) {
        console.log('Waiting for jscanify...');
      }

      if (isOpenCVReady()) {
        clearInterval(checkInterval);
        console.log('OpenCV and jscanify loaded successfully after', attempts * 100, 'ms');
        resolve();
        return;
      }

      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('Timeout loading libraries. OpenCV ready:', cvReady, 'jscanify ready:', jscanifyReady);
        reject(new Error('Libraries loading timeout - please check your internet connection and refresh the page'));
      }
    }, 100);
  });
};

// Convert image URL to canvas
const urlToCanvas = (imageUrl: string): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Detect document edges using jscanify
export const detectDocumentEdges = async (imageUrl: string): Promise<DetectedEdges | null> => {
  if (!isOpenCVReady()) {
    throw new Error('jscanify/OpenCV is not ready');
  }

  let mat = null;
  let contour = null;

  try {
    const canvas = await urlToCanvas(imageUrl);
    const scannerInstance = new window.jscanify();
    
    // Convert canvas to cv.Mat
    mat = window.cv.imread(canvas);
    
    // Find paper contour using jscanify
    contour = scannerInstance.findPaperContour(mat);
    
    if (contour) {
      // Get corner points from contour
      const cornerPoints = scannerInstance.getCornerPoints(contour);
      
      if (cornerPoints.topLeftCorner && cornerPoints.topRightCorner && 
          cornerPoints.bottomLeftCorner && cornerPoints.bottomRightCorner) {
        const edges: DetectedEdges = {
          topLeft: cornerPoints.topLeftCorner,
          topRight: cornerPoints.topRightCorner,
          bottomLeft: cornerPoints.bottomLeftCorner,
          bottomRight: cornerPoints.bottomRightCorner,
        };
        
        return edges;
      }
    }

    // Return default corners if detection fails
    console.log('Document detection failed, using default corners');
    return {
      topLeft: { x: 0, y: 0 },
      topRight: { x: canvas.width, y: 0 },
      bottomLeft: { x: 0, y: canvas.height },
      bottomRight: { x: canvas.width, y: canvas.height },
    };
  } catch (error) {
    console.error('Error detecting edges with jscanify:', error);
    return null;
  } finally {
    // Clean up
    if (mat) mat.delete();
    if (contour) contour.delete();
  }
};

// Apply perspective transform using jscanify
export const applyPerspectiveTransform = async (
  imageUrl: string,
  corners: DetectedEdges
): Promise<string> => {
  if (!isOpenCVReady()) {
    throw new Error('OpenCV is not ready');
  }

  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          const scannerInstance = new window.jscanify();
          
          // Calculate dimensions
          const widthTop = Math.sqrt(
            Math.pow(corners.topRight.x - corners.topLeft.x, 2) +
            Math.pow(corners.topRight.y - corners.topLeft.y, 2)
          );
          const widthBottom = Math.sqrt(
            Math.pow(corners.bottomRight.x - corners.bottomLeft.x, 2) +
            Math.pow(corners.bottomRight.y - corners.bottomLeft.y, 2)
          );
          const maxWidth = Math.max(widthTop, widthBottom);
          
          const heightLeft = Math.sqrt(
            Math.pow(corners.bottomLeft.x - corners.topLeft.x, 2) +
            Math.pow(corners.bottomLeft.y - corners.topLeft.y, 2)
          );
          const heightRight = Math.sqrt(
            Math.pow(corners.bottomRight.x - corners.topRight.x, 2) +
            Math.pow(corners.bottomRight.y - corners.topRight.y, 2)
          );
          const maxHeight = Math.max(heightLeft, heightRight);

          // Use custom corner points
          const cornerPoints = {
            topLeftCorner: corners.topLeft,
            topRightCorner: corners.topRight,
            bottomLeftCorner: corners.bottomLeft,
            bottomRightCorner: corners.bottomRight,
          };

          const resultCanvas = scannerInstance.extractPaper(img, maxWidth, maxHeight, cornerPoints);
          const dataUrl = resultCanvas.toDataURL('image/png');
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error applying perspective transform:', error);
    throw error;
  }
};

