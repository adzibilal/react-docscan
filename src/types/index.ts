// Image processing types
export interface ImageData {
  url: string;
  file?: File;
  width: number;
  height: number;
}

export interface ProcessedImage extends ImageData {
  originalUrl: string;
}

export interface Corner {
  x: number;
  y: number;
}

export interface DetectedEdges {
  topLeft: Corner;
  topRight: Corner;
  bottomLeft: Corner;
  bottomRight: Corner;
}

export type ProcessingStep = 
  | 'capture' 
  | 'edge-detection' 
  | 'edit' 
  | 'export';

export interface AppState {
  currentStep: ProcessingStep;
  originalImage: ImageData | null;
  processedImage: ProcessedImage | null;
  detectedEdges: DetectedEdges | null;
  isProcessing: boolean;
  error: string | null;
  opencvReady: boolean;
}

export type ExportFormat = 'image/jpeg' | 'image/png';

export interface ExportOptions {
  format: ExportFormat;
  quality: number; // 0.1 to 1.0 for JPEG
  filename: string;
}

// OpenCV types helper
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type OpenCV = any;

declare global {
  interface Window {
    cv: OpenCV;
  }
}

