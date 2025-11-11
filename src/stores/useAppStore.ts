import { create } from 'zustand';
import type { AppState, ImageData, ProcessedImage, DetectedEdges, ProcessingStep } from '../types';

interface AppStore extends AppState {
  setCurrentStep: (step: ProcessingStep) => void;
  setOriginalImage: (image: ImageData | null) => void;
  setProcessedImage: (image: ProcessedImage | null) => void;
  setDetectedEdges: (edges: DetectedEdges | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  setOpencvReady: (ready: boolean) => void;
  reset: () => void;
}

const initialState: AppState = {
  currentStep: 'capture',
  originalImage: null,
  processedImage: null,
  detectedEdges: null,
  isProcessing: false,
  error: null,
  opencvReady: false,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  setCurrentStep: (step) => set({ currentStep: step }),
  setOriginalImage: (image) => set({ originalImage: image }),
  setProcessedImage: (image) => set({ processedImage: image }),
  setDetectedEdges: (edges) => set({ detectedEdges: edges }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  setOpencvReady: (ready) => set({ opencvReady: ready }),
  reset: () => set(initialState),
}));

