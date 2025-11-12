import { useEffect, useState } from 'react';
import { useAppStore } from './stores/useAppStore';
import { waitForOpenCV } from './utils/jscanify';
import { WebcamCapture } from './components/WebcamCapture';
import { FileUpload } from './components/FileUpload';
import { EdgeDetection } from './components/EdgeDetection';
import { ImageEditor } from './components/ImageEditor';
import { ExportImage } from './components/ExportImage';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { StepIndicator } from './components/StepIndicator';

function App() {
  const currentStep = useAppStore((state) => state.currentStep);
  const isProcessing = useAppStore((state) => state.isProcessing);
  const error = useAppStore((state) => state.error);
  const opencvReady = useAppStore((state) => state.opencvReady);
  const setOpencvReady = useAppStore((state) => state.setOpencvReady);
  const setError = useAppStore((state) => state.setError);

  const [captureMode, setCaptureMode] = useState<'webcam' | 'upload'>('webcam');
  const [opencvLoading, setOpencvLoading] = useState(true);

  // Wait for OpenCV to load
  useEffect(() => {
    const initOpenCV = async () => {
      try {
        await waitForOpenCV();
        setOpencvReady(true);
        console.log('OpenCV initialized successfully');
      } catch (error) {
        console.error('Failed to load OpenCV:', error);
        setError(
          error instanceof Error 
            ? error.message 
            : 'Failed to load OpenCV. Please check your internet connection and refresh the page.'
        );
        setOpencvReady(false);
      } finally {
        setOpencvLoading(false);
      }
    };

    initOpenCV();
  }, [setOpencvReady, setError]);

  const renderContent = () => {
    switch (currentStep) {
      case 'capture':
        return (
          <div className="space-y-8">
            {/* Mode selector */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setCaptureMode('webcam')}
                className={`
                  px-6 py-3 font-semibold rounded-lg transition-all
                  ${captureMode === 'webcam'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
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
                  </svg>
                  Use Webcam
                </div>
              </button>
              <button
                onClick={() => setCaptureMode('upload')}
                className={`
                  px-6 py-3 font-semibold rounded-lg transition-all
                  ${captureMode === 'upload'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-blue-400'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Upload File
                </div>
              </button>
            </div>

            {/* Content based on mode */}
            {captureMode === 'webcam' ? <WebcamCapture /> : <FileUpload />}
          </div>
        );

      case 'edge-detection':
        return <EdgeDetection />;

      case 'edit':
        return <ImageEditor />;

      case 'export':
        return <ExportImage />;

      default:
        return null;
    }
  };

  if (opencvLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-xl flex flex-col items-center gap-4 max-w-md mx-4">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
          <p className="text-gray-700 font-medium">Loading Document Scanner...</p>
          <p className="text-sm text-gray-500 text-center">
            Loading jscanify & OpenCV.js from CDN. This may take a moment depending on your connection.
          </p>
        </div>
      </div>
    );
  }

  // If on capture step with webcam, render full screen without wrapper
  if (currentStep === 'capture' && captureMode === 'webcam') {
    return (
      <>
        {renderContent()}
        {isProcessing && <LoadingSpinner />}
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">
              📄 Document Scanner
            </h1>
            {!opencvReady && !opencvLoading && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-yellow-600 text-sm">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Edge detection unavailable
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                >
                  Reload Page
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentStep !== 'capture' && (
          <StepIndicator currentStep={currentStep} />
        )}
        
        <div className="bg-white rounded-lg shadow-xl p-8">
          {renderContent()}
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 text-sm">
        <p>Built with React + TypeScript + OpenCV.js + Tailwind CSS</p>
      </footer>

      {/* Loading spinner overlay */}
      {isProcessing && <LoadingSpinner />}

      {/* Error message */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
    </div>
  );
}

export default App;
