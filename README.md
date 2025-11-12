# Document Scanner with OpenCV.js

A modern web-based document scanner built with React, TypeScript, Vite, and OpenCV.js. This application uses your device camera to scan documents with real-time guidance and automatically detects document boundaries to crop and straighten them.

## Features

- 📹 **Camera Input** - Scan documents directly from your device camera
- 📐 **Guide Overlay** - Rectangle guide with corner markers for perfect document positioning
- 🎯 **Live Detection** - Optional real-time document boundary detection while previewing
- 🔍 **Automatic Document Detection** - Uses OpenCV.js contour detection to find document boundaries
- 📐 **Perspective Transformation** - Applies warp perspective to crop and straighten documents
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS v3
- 📱 **Mobile & Desktop** - Works seamlessly on all devices with camera support
- 💾 **Download Results** - Save the scanned document as an image file
- ⚡ **Fast Processing** - 100% client-side processing with no server required
- 🔒 **Privacy First** - All processing happens in your browser, no data uploaded

## Technologies Used

- **React** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **OpenCV.js** - Computer vision library for document detection
- **Tailwind CSS v3** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd react-docscan
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## How to Use

### Camera Scanning Mode (Default)

1. **Activate Camera** - Click "Aktifkan Kamera" to start the camera
2. **Position Document** - Place your document within the green guide rectangle
3. **Optional: Enable Live Detection** - Toggle "Live Detection" to see real-time boundary detection
4. **Capture** - Press the green "Capture" button when ready
5. **Review Detection** - The detected corners are shown as numbered red dots with a green outline
6. **Crop Document** - Click "Crop" to apply perspective correction
7. **Download or Retake** - Save your scanned document or take another photo

### Alternative: File Upload Mode

A file upload version is also available in `src/components/DocumentScanner.tsx` if you prefer uploading images instead of using the camera.

## Tips for Best Results

- **Lighting**: Use good lighting, avoid dark environments
- **Contrast**: White/light documents on dark backgrounds work best
- **Positioning**: Keep document flat and align with the guide rectangle
- **Stability**: Hold camera steady while capturing
- **Full View**: Ensure all four corners of the document are visible
- **Shadows**: Avoid shadows and reflections
- **Live Detection**: Use the live detection toggle for real-time feedback

## Browser Requirements

- **HTTPS or Localhost**: Camera access requires secure context
- **Modern Browser**: Chrome 53+, Firefox 36+, Safari 11+, Edge 12+
- **Camera Permission**: You must allow camera access when prompted

## Project Structure

```
src/
├── components/
│   ├── CameraScanner.tsx      # Camera-based scanner (main)
│   └── DocumentScanner.tsx    # File upload version
├── hooks/
│   └── useCamera.ts           # Camera management hook
├── lib/
│   └── document-scanner.ts    # OpenCV.js document detection logic
├── types/
│   └── opencv.d.ts            # TypeScript declarations for OpenCV
├── App.tsx                     # App wrapper (uses CameraScanner)
├── main.tsx                    # Entry point
└── index.css                   # Tailwind CSS imports
```

## Implementation Details

### Document Detection Algorithm

1. **Preprocessing**
   - Convert image to grayscale
   - Apply Gaussian blur to reduce noise
   - Apply threshold to create binary image

2. **Contour Detection**
   - Find all contours in the image
   - Select the largest contour (assumed to be the document)

3. **Corner Extraction**
   - Calculate the minimum area rectangle
   - Find the four corners by determining the points farthest from the center in each quadrant

4. **Perspective Transformation**
   - Calculate output dimensions based on detected corners
   - Apply perspective transformation to warp the document to a rectangle
   - Output the cropped and straightened document

## Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

## License

MIT

## Acknowledgments

- Implementation based on the tutorial: [Web Document Scanner with OpenCV.js](https://www.dynamsoft.com/codepool/web-document-scanner-with-opencvjs.html)
- OpenCV.js library from [OpenCV](https://opencv.org/)
