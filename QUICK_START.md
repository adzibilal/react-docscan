# Quick Start Guide

## 🚀 Running the Application

### Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

**Important**: Camera access requires HTTPS or localhost!

### Build for Production

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📋 How to Use the Document Scanner

### Step-by-Step Instructions:

1. **Wait for OpenCV to Load**
   - You'll see "Ready" indicator when ready (green badge)

2. **Activate Camera**
   - Click "Aktifkan Kamera" button
   - Allow camera access when browser asks for permission
   - Camera preview will appear with green guide rectangle

3. **Position Your Document**
   - Place document within the green guide rectangle
   - Align document with corner markers
   - Keep document flat and well-lit
   - Follow the instruction: "Posisikan dokumen dalam frame"

4. **Optional: Enable Live Detection**
   - Click "Live Detection: OFF" to toggle ON
   - Yellow outline appears when document is detected
   - Red dots show detected corners in real-time
   - This helps you position the document perfectly

5. **Capture Photo**
   - Click green "Capture" button
   - Camera stops and shows captured image
   - App automatically detects document boundaries
   - You'll see:
     - Green outline showing the document border
     - Red dots marking the 4 corners
     - Numbers (1-4) labeling each corner

6. **Crop the Document**
   - Click "Crop" button
   - The app applies perspective transformation
   - The straightened, cropped document appears on the right

7. **Download or Retake**
   - Click "Download" button to save as `scanned-document.png`
   - Click "Retake" to capture another photo

## 💡 Tips for Best Results

### ✅ Good Images:
- Clear document edges
- Good lighting
- High contrast (white paper on dark table)
- No shadows or glare
- Entire document visible
- Flat surface

### ❌ Challenging Images:
- Complex backgrounds
- Poor lighting
- Low contrast
- Wrinkled or folded documents
- Partial documents
- Multiple overlapping documents

## 🎨 Features You'll See

### UI Elements:
- **Status Badge**: Shows if OpenCV is ready (green) or loading (yellow)
- **Original Image View**: Your uploaded photo
- **Detection View**: Image with detected boundaries overlay
- **Cropped Result**: Final straightened document
- **Action Buttons**: Control the scanning process

### Visual Feedback:
- **Green Line**: Detected document border
- **Red Dots**: Corner points (numbered 1-4)
- **Processing State**: Buttons disable during processing
- **Error Messages**: Red alerts for any issues

## 🔧 Troubleshooting

### "Could not detect document boundaries"
- Try a different image with better contrast
- Ensure the document has clear edges
- Use better lighting
- Try a simpler background

### "OpenCV not found"
- Check your internet connection (OpenCV loads from CDN)
- Refresh the page
- Wait a few seconds for loading

### Slow Performance
- Use smaller images (resize before uploading)
- Close other browser tabs
- Try a more powerful device

## 📱 Mobile Usage

The app works on mobile devices!
- Use your phone's camera to take photos
- Same workflow as desktop
- Responsive design adapts to screen size

## 🎯 Example Use Cases

- **Receipts**: Scan receipts for expense tracking
- **Documents**: Digitize paper documents
- **Whiteboards**: Capture whiteboard notes
- **Books**: Scan book pages
- **Business Cards**: Digitize business cards
- **Forms**: Scan filled forms

## 🛠️ Development Scripts

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 📦 What's Included

- ✅ React 19 with TypeScript
- ✅ Vite 7 (fast build tool)
- ✅ Tailwind CSS v3 (styling)
- ✅ OpenCV.js 4.8.0 (computer vision)
- ✅ Modern, responsive UI
- ✅ Complete error handling
- ✅ Type-safe implementation

## 🌟 Next Steps

After testing the app:
1. Try different types of documents
2. Experiment with various lighting conditions
3. Test on different devices
4. Consider adding features like:
   - Manual corner adjustment
   - Multiple document detection
   - Batch processing
   - Image filters (grayscale, contrast)
   - PDF export

Enjoy scanning! 📄✨

