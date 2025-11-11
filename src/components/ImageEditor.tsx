import { useRef, useState, useCallback } from 'react';
import Cropper, { type ReactCropperElement } from 'react-cropper';
import 'react-cropper/node_modules/cropperjs/dist/cropper.css';
import { useAppStore } from '../stores/useAppStore';
import { rotateImage, adjustBrightnessContrast } from '../utils/imageProcessing';

export const ImageEditor = () => {
  const cropperRef = useRef<ReactCropperElement>(null);
  const processedImage = useAppStore((state) => state.processedImage);
  const setProcessedImage = useAppStore((state) => state.setProcessedImage);
  const setCurrentStep = useAppStore((state) => state.setCurrentStep);
  const setProcessing = useAppStore((state) => state.setProcessing);
  const setError = useAppStore((state) => state.setError);

  const [currentImage, setCurrentImage] = useState(processedImage?.url || '');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [isCropping, setIsCropping] = useState(false);

  // Handle rotation
  const handleRotate = useCallback(async (degrees: number) => {
    if (!currentImage) return;

    setProcessing(true);
    try {
      const rotatedUrl = await rotateImage(currentImage, degrees);
      setCurrentImage(rotatedUrl);
      setError(null);
    } catch (error) {
      console.error('Error rotating image:', error);
      setError('Failed to rotate image');
    } finally {
      setProcessing(false);
    }
  }, [currentImage, setProcessing, setError]);

  // Handle brightness/contrast adjustment
  const handleAdjustments = useCallback(async () => {
    if (!processedImage || (brightness === 0 && contrast === 0)) return;

    setProcessing(true);
    try {
      const adjustedUrl = await adjustBrightnessContrast(
        processedImage.url,
        brightness,
        contrast
      );
      setCurrentImage(adjustedUrl);
      setBrightness(0);
      setContrast(0);
      setError(null);
    } catch (error) {
      console.error('Error adjusting image:', error);
      setError('Failed to adjust image');
    } finally {
      setProcessing(false);
    }
  }, [processedImage, brightness, contrast, setProcessing, setError]);

  // Handle crop
  const handleCrop = useCallback(() => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;

    const croppedCanvas = cropper.getCroppedCanvas();
    const croppedUrl = croppedCanvas.toDataURL();
    setCurrentImage(croppedUrl);
    setIsCropping(false);
  }, []);

  // Cancel crop
  const handleCancelCrop = useCallback(() => {
    setIsCropping(false);
  }, []);

  // Reset to original
  const handleReset = useCallback(() => {
    if (processedImage) {
      setCurrentImage(processedImage.url);
      setBrightness(0);
      setContrast(0);
      setIsCropping(false);
    }
  }, [processedImage]);

  // Save and continue
  const handleContinue = useCallback(() => {
    if (!processedImage || !currentImage) return;

    const img = new Image();
    img.onload = () => {
      setProcessedImage({
        ...processedImage,
        url: currentImage,
        width: img.width,
        height: img.height,
      });
      setCurrentStep('export');
    };
    img.src = currentImage;
  }, [processedImage, currentImage, setProcessedImage, setCurrentStep]);

  if (!processedImage) {
    return (
      <div className="text-center text-gray-500">
        No processed image available. Please go back and process an image first.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Edit Document
        </h2>
        <p className="text-gray-600">
          Crop, rotate, or adjust your document
        </p>
      </div>

      {/* Image display */}
      <div className="relative w-full max-w-3xl">
        {isCropping ? (
          <Cropper
            ref={cropperRef}
            src={currentImage}
            style={{ height: 600, width: '100%' }}
            aspectRatio={undefined}
            guides={true}
            viewMode={1}
            background={false}
            responsive={true}
            autoCropArea={1}
            checkOrientation={false}
          />
        ) : (
          <img
            src={currentImage}
            alt="Processed document"
            className="w-full h-auto rounded-lg shadow-lg"
          />
        )}
      </div>

      {/* Controls */}
      {isCropping ? (
        <div className="flex gap-4">
          <button
            onClick={handleCancelCrop}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Apply Crop
          </button>
        </div>
      ) : (
        <>
          {/* Tool buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setIsCropping(true)}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Crop
            </button>

            <button
              onClick={() => handleRotate(90)}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Rotate 90°
            </button>

            <button
              onClick={() => handleRotate(180)}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Rotate 180°
            </button>

            <button
              onClick={handleReset}
              className="px-4 py-2 bg-white border-2 border-gray-300 hover:border-red-500 text-gray-700 font-medium rounded-lg transition-colors flex items-center gap-2"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>
          </div>

          {/* Brightness and contrast sliders */}
          <div className="w-full max-w-md space-y-4 bg-white p-6 rounded-lg shadow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Brightness: {brightness}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contrast: {contrast}
              </label>
              <input
                type="range"
                min="-100"
                max="100"
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {(brightness !== 0 || contrast !== 0) && (
              <button
                onClick={handleAdjustments}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Apply Adjustments
              </button>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => setCurrentStep('edge-detection')}
              className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleContinue}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              Continue to Export
            </button>
          </div>
        </>
      )}
    </div>
  );
};

