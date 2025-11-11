import type { DetectedEdges, Corner } from '../types';

// Check if OpenCV is loaded
export const isOpenCVReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.cv !== 'undefined';
};

// Wait for OpenCV to load
export const waitForOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (isOpenCVReady()) {
      console.log('OpenCV already loaded');
      resolve();
      return;
    }

    // Check if there was a load error
    if (typeof window !== 'undefined' && (window as any).openCVLoadError) {
      reject(new Error('OpenCV failed to load from CDN'));
      return;
    }

    let attempts = 0;
    const maxAttempts = 300; // 30 seconds (300 * 100ms)
    
    const checkInterval = setInterval(() => {
      attempts++;
      
      // Check if OpenCV is ready
      if (isOpenCVReady()) {
        clearInterval(checkInterval);
        console.log('OpenCV loaded successfully after', attempts * 100, 'ms');
        resolve();
        return;
      }
      
      // Check if there was a load error
      if (typeof window !== 'undefined' && (window as any).openCVLoadError) {
        clearInterval(checkInterval);
        reject(new Error('OpenCV failed to load from CDN'));
        return;
      }
      
      // Timeout after max attempts
      if (attempts >= maxAttempts) {
        clearInterval(checkInterval);
        console.error('OpenCV loading timeout');
        reject(new Error('OpenCV loading timeout - please check your internet connection'));
      }
    }, 100);
  });
};

// Convert image URL to cv.Mat
export const urlToMat = async (imageUrl: string): Promise<unknown> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        const mat = window.cv.imread(canvas);
        resolve(mat);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};

// Convert cv.Mat to data URL
export const matToDataURL = (mat: unknown, format = 'image/png'): string => {
  const canvas = document.createElement('canvas');
  window.cv.imshow(canvas, mat);
  return canvas.toDataURL(format);
};

// Find document edges using Canny edge detection and contours
export const detectDocumentEdges = async (imageUrl: string): Promise<DetectedEdges | null> => {
  if (!isOpenCVReady()) {
    throw new Error('OpenCV is not ready');
  }

  const cv = window.cv;
  let src: unknown | null = null;
  let gray: unknown | null = null;
  let blurred: unknown | null = null;
  let edges: unknown | null = null;
  let contours: unknown | null = null;
  let hierarchy: unknown | null = null;

  try {
    // Load image
    src = await urlToMat(imageUrl);
    
    // Convert to grayscale
    gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    
    // Apply Gaussian blur
    blurred = new cv.Mat();
    cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
    
    // Canny edge detection
    edges = new cv.Mat();
    cv.Canny(blurred, edges, 50, 150);
    
    // Find contours
    contours = new cv.MatVector();
    hierarchy = new cv.Mat();
    cv.findContours(edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    
    // Find the largest contour
    let maxArea = 0;
    let maxContourIndex = -1;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contoursVec = contours as any;
    for (let i = 0; i < contoursVec.size(); i++) {
      const contour = contoursVec.get(i);
      const area = cv.contourArea(contour);
      if (area > maxArea) {
        maxArea = area;
        maxContourIndex = i;
      }
      contour.delete();
    }
    
    if (maxContourIndex === -1) {
      return null;
    }
    
    // Get the largest contour
    const largestContour = contoursVec.get(maxContourIndex);
    
    // Approximate the contour to a polygon
    const epsilon = 0.02 * cv.arcLength(largestContour, true);
    const approx = new cv.Mat();
    cv.approxPolyDP(largestContour, approx, epsilon, true);
    
    // Check if we found a quadrilateral
    if (approx.rows === 4) {
      const corners: Corner[] = [];
      for (let i = 0; i < 4; i++) {
        corners.push({
          x: approx.intAt(i, 0),
          y: approx.intAt(i, 1),
        });
      }
      
      // Sort corners: top-left, top-right, bottom-right, bottom-left
      corners.sort((a, b) => a.y - b.y);
      const topCorners = corners.slice(0, 2).sort((a, b) => a.x - b.x);
      const bottomCorners = corners.slice(2, 4).sort((a, b) => a.x - b.x);
      
      approx.delete();
      
      return {
        topLeft: topCorners[0],
        topRight: topCorners[1],
        bottomLeft: bottomCorners[0],
        bottomRight: bottomCorners[1],
      };
    }
    
    approx.delete();
    
    // If no quadrilateral found, return image corners
    const width = (src as { cols: number }).cols;
    const height = (src as { rows: number }).rows;
    
    return {
      topLeft: { x: 0, y: 0 },
      topRight: { x: width, y: 0 },
      bottomLeft: { x: 0, y: height },
      bottomRight: { x: width, y: height },
    };
    
  } catch (error) {
    console.error('Error detecting edges:', error);
    return null;
  } finally {
    // Clean up
    if (src) (src as { delete: () => void }).delete();
    if (gray) (gray as { delete: () => void }).delete();
    if (blurred) (blurred as { delete: () => void }).delete();
    if (edges) (edges as { delete: () => void }).delete();
    if (contours) (contours as { delete: () => void }).delete();
    if (hierarchy) (hierarchy as { delete: () => void }).delete();
  }
};

// Apply perspective transform
export const applyPerspectiveTransform = async (
  imageUrl: string,
  corners: DetectedEdges
): Promise<string> => {
  if (!isOpenCVReady()) {
    throw new Error('OpenCV is not ready');
  }

  const cv = window.cv;
  let src: unknown | null = null;
  let dst: unknown | null = null;
  let srcTri: unknown | null = null;
  let dstTri: unknown | null = null;
  let M: unknown | null = null;

  try {
    src = await urlToMat(imageUrl);
    
    // Calculate the width and height of the new image
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
    
    // Source points (corners of the document)
    srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      corners.topLeft.x, corners.topLeft.y,
      corners.topRight.x, corners.topRight.y,
      corners.bottomRight.x, corners.bottomRight.y,
      corners.bottomLeft.x, corners.bottomLeft.y,
    ]);
    
    // Destination points (corners of the new image)
    dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,
      maxWidth, 0,
      maxWidth, maxHeight,
      0, maxHeight,
    ]);
    
    // Get perspective transform matrix
    M = cv.getPerspectiveTransform(srcTri, dstTri);
    
    // Apply perspective transform
    dst = new cv.Mat();
    cv.warpPerspective(
      src,
      dst,
      M,
      new cv.Size(maxWidth, maxHeight),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );
    
    const result = matToDataURL(dst);
    
    return result;
    
  } catch (error) {
    console.error('Error applying perspective transform:', error);
    throw error;
  } finally {
    if (src) (src as { delete: () => void }).delete();
    if (dst) (dst as { delete: () => void }).delete();
    if (srcTri) (srcTri as { delete: () => void }).delete();
    if (dstTri) (dstTri as { delete: () => void }).delete();
    if (M) (M as { delete: () => void }).delete();
  }
};

