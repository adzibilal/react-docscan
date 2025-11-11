# Document Scanner Web App

A modern, client-side document scanning application built with React, TypeScript, OpenCV.js, and Tailwind CSS. Scan documents using your webcam or by uploading images, with automatic edge detection, perspective correction, and image editing capabilities.

## Features

- 📸 **Webcam Capture** - Take photos directly from your device camera
- 📁 **File Upload** - Upload images from your device (JPG, PNG, HEIC)
- 🔍 **Auto Edge Detection** - Automatic document boundary detection using OpenCV.js
- ✂️ **Perspective Correction** - Straighten skewed documents automatically
- 🎨 **Image Editing** - Crop, rotate, adjust brightness and contrast
- 💾 **Export** - Download as JPG or PNG with quality control
- 📱 **Responsive Design** - Works on desktop and mobile devices
- ⚡ **Client-Side Processing** - No server required, all processing happens in your browser

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type-safe code
- **Vite** - Fast build tool
- **Tailwind CSS v3** - Utility-first CSS framework
- **jscanify** - Document scanning library (uses OpenCV.js under the hood)
- **Zustand** - State management
- **react-webcam** - Webcam access
- **Cropper.js** - Image cropping
- **react-cropper** - React wrapper for Cropper.js

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
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

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### 1. Capture or Upload
- **Use Webcam**: Click "Use Webcam" and capture a photo of your document
- **Upload File**: Click "Upload File" and select an image from your device

### 2. Detect Edges
- The app will automatically detect document edges
- Drag corner points to adjust if needed
- Click "Apply Correction" to straighten the document

### 3. Edit
- **Crop**: Click "Crop" to trim the image
- **Rotate**: Rotate by 90° or 180°
- **Adjust**: Fine-tune brightness and contrast
- Click "Continue to Export" when done

### 4. Export
- Choose format (JPG or PNG)
- Adjust quality (for JPG)
- Enter filename
- Click "Download Image"

## Project Structure

```
src/
├── components/
│   ├── WebcamCapture.tsx      # Webcam capture component
│   ├── FileUpload.tsx          # File upload with drag & drop
│   ├── EdgeDetection.tsx       # Edge detection & perspective correction
│   ├── ImageEditor.tsx         # Crop, rotate, adjust controls
│   ├── ExportImage.tsx         # Export & download functionality
│   ├── LoadingSpinner.tsx      # Loading overlay
│   ├── ErrorMessage.tsx        # Error notification
│   └── StepIndicator.tsx       # Progress indicator
├── stores/
│   └── useAppStore.ts          # Zustand store for app state
├── types/
│   └── index.ts                # TypeScript type definitions
├── utils/
│   ├── opencv.ts               # OpenCV helper functions
│   └── imageProcessing.ts      # Image manipulation utilities
├── App.tsx                     # Main app component
├── main.tsx                    # App entry point
└── index.css                   # Global styles with Tailwind
```

## Browser Compatibility

- Chrome/Edge 88+ (recommended)
- Firefox 90+
- Safari 14+
- Opera 74+

**Note**: Webcam feature requires HTTPS in production or localhost in development.

## Features in Detail

### Edge Detection
Uses **jscanify** library (powered by OpenCV.js) to automatically find document boundaries. The detected corners can be manually adjusted for precision.

### Perspective Correction
Uses **jscanify's** perspective transformation to straighten documents that are photographed at an angle, making them appear as if scanned from directly above.

### Image Editing
- **Crop**: Interactive cropping with drag handles
- **Rotate**: Quick 90° and 180° rotation
- **Brightness/Contrast**: Slider controls for fine-tuning

### Export Options
- **Format**: JPG (smaller file size) or PNG (lossless quality)
- **Quality**: Adjustable quality for JPG (10-100%)
- **Filename**: Custom naming for downloads

## Development

### Code Style

This project follows TypeScript best practices:
- No `any` types - all types are explicitly defined
- Functional components with hooks
- Custom hooks for reusable logic
- Proper error handling

### State Management

Uses Zustand for simple, efficient state management:
- Centralized app state
- Type-safe actions
- Minimal boilerplate

### Styling

Tailwind CSS v3 for consistent, responsive design:
- Utility-first approach
- Custom color scheme
- Mobile-first responsive design
- Dark mode ready (can be enabled)

## Performance

- jscanify & OpenCV.js are loaded asynchronously via CDN
- Images processed entirely client-side
- No server requests after initial load
- Optimized for mobile devices

## Troubleshooting

### jscanify/OpenCV not loading
- Check internet connection (libraries load from CDN)
- Wait a few moments for the libraries to load
- Clear browser cache and reload
- Click "Reload Page" button if edge detection is unavailable

### Webcam not working
- Grant camera permissions when prompted
- Use HTTPS in production
- Check browser compatibility

### Edge detection failing
- Ensure good lighting
- Place document on contrasting background
- Manually adjust corners if auto-detection fails

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [jscanify](https://colonelparrot.github.io/jscanify/) by ColonelParrot - JavaScript document scanning library
- OpenCV.js for computer vision capabilities
- Tailwind CSS for styling
- React team for the amazing framework
