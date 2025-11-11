# Quick Start Guide

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

## How to Use

### Step 1: Capture/Upload
Choose one of two options:
- **Use Webcam**: Click the button to capture a photo
- **Upload File**: Drag & drop or browse for an image

### Step 2: Edge Detection
- The app automatically detects document edges
- Drag the corner points to adjust if needed
- Click "Apply Correction" to straighten the document
- Or click "Skip" to proceed without correction

### Step 3: Edit
Edit your document:
- **Crop**: Click "Crop" button and adjust the selection
- **Rotate**: Rotate by 90° or 180°
- **Adjust**: Use sliders to change brightness and contrast
- Click "Continue to Export" when done

### Step 4: Export
- Choose format (JPG or PNG)
- Adjust quality (for JPG only)
- Enter a filename
- Click "Download Image"

## Features

✅ Webcam capture with camera switching  
✅ File upload with drag & drop  
✅ Automatic edge detection using OpenCV.js  
✅ Manual corner adjustment  
✅ Perspective correction  
✅ Interactive cropping  
✅ Image rotation  
✅ Brightness/contrast adjustment  
✅ Multiple export formats  
✅ Responsive design  

## Browser Requirements

- Modern browser with WebRTC support (Chrome, Firefox, Safari, Edge)
- HTTPS required for webcam in production (localhost works in development)
- Internet connection for loading jscanify & OpenCV.js (loaded from CDN)

## Troubleshooting

**jscanify/OpenCV not loading?**
- Wait a few seconds for the libraries to load from CDN
- Check your internet connection
- Click "Reload Page" button in the header

**Webcam not working?**
- Grant camera permissions when prompted
- Ensure you're on HTTPS (or localhost)

**Edge detection not accurate?**
- Ensure good lighting
- Place document on contrasting background
- Manually adjust corners if needed

## Development

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

**Type checking:**
```bash
npm run build
```

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v3
- jscanify (document scanning, uses OpenCV.js)
- Zustand (state management)
- react-webcam (webcam access)
- Cropper.js (image cropping)

---

Enjoy scanning! 📄✨

