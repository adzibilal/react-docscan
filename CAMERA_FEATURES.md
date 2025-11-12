# Fitur Kamera - Document Scanner

## ✅ Fitur yang Telah Diimplementasi

### 1. 📹 Input dari Kamera
- Input langsung dari kamera perangkat (bukan upload file)
- Menggunakan `getUserMedia` API untuk akses kamera
- Preferensi kamera belakang untuk perangkat mobile (`facingMode: 'environment'`)
- Resolusi optimal: 1920x1080

### 2. 📐 Overlay Guide Persegi Panjang
- **Guide Rectangle**: Area persegi panjang (80% lebar, 70% tinggi layar)
- **Overlay Gelap**: Area di luar guide rectangle menjadi semi-transparan
- **Border Guide**: Garis putus-putus hijau mengelilingi area guide
- **Corner Markers**: Tanda sudut hijau di keempat pojok guide
- **Instruksi**: Teks "Posisikan dokumen dalam frame" di bagian atas

### 3. 🎯 Live Detection (Opsional)
- Toggle untuk mengaktifkan/menonaktifkan deteksi real-time
- Mendeteksi dokumen setiap 500ms
- Menampilkan outline kuning dan titik merah untuk dokumen yang terdeteksi
- Bekerja sambil preview kamera aktif

### 4. 📸 Capture & Processing
- Tombol capture untuk mengambil foto
- Auto-detect dokumen setelah capture
- Crop dengan perspective transformation
- Download hasil scan

## 🎨 UI/UX Design

### Camera View
```
┌─────────────────────────────────────┐
│     Posisikan dokumen dalam frame   │
│                                     │
│  ┌───╮                       ┌───╮  │
│  │   │                       │   │  │
│  └───┘                       └───┘  │
│                                     │
│        [GUIDE RECTANGLE AREA]       │
│                                     │
│  ┌───╮                       ┌───╮  │
│  │   │                       │   │  │
│  └───┘                       └───┘  │
│                                     │
└─────────────────────────────────────┘
  [Capture] [Live Detection] [Stop]
```

### Warna & Styling
- **Background**: Gradient biru (from-blue-50 to-indigo-100)
- **Guide Border**: Hijau (#00ff00) dengan dashed line
- **Corner Markers**: Hijau tebal (#00ff00)
- **Dark Overlay**: Hitam semi-transparan (rgba(0, 0, 0, 0.5))
- **Live Detection**: Kuning (#ffff00) untuk outline
- **Corner Points**: Merah (#ff0000) untuk titik sudut

## 📱 Cara Penggunaan

### Step 1: Aktifkan Kamera
1. Klik tombol "Aktifkan Kamera"
2. Izinkan akses kamera saat browser meminta permission
3. Kamera akan menyala dengan overlay guide

### Step 2: Posisikan Dokumen
1. Letakkan dokumen dalam area guide rectangle
2. Pastikan keempat sudut dokumen terlihat jelas
3. (Opsional) Aktifkan "Live Detection" untuk melihat deteksi real-time

### Step 3: Capture
1. Klik tombol "Capture" hijau
2. Foto akan diambil dan kamera berhenti
3. Sistem otomatis mendeteksi batas dokumen

### Step 4: Review & Crop
1. Lihat hasil deteksi (garis hijau, titik merah bernomor)
2. Klik "Crop" untuk memotong dan meluruskan dokumen
3. Hasil scan muncul di panel kanan

### Step 5: Download atau Retake
- Klik "Download" untuk menyimpan hasil
- Klik "Retake" untuk mengambil foto ulang

## 🔧 Komponen Teknis

### 1. useCamera Hook (`src/hooks/useCamera.ts`)
Custom React hook untuk mengelola kamera:
- `startCamera()` - Aktifkan kamera
- `stopCamera()` - Matikan kamera
- `captureImage()` - Ambil foto dari video stream
- `videoRef` - Reference ke elemen video
- `isActive` - Status kamera (aktif/tidak)
- `error` - Error message jika ada

### 2. CameraScanner Component (`src/components/CameraScanner.tsx`)
Komponen utama dengan fitur:
- Camera preview dengan video element
- Canvas overlay untuk guide dan detection
- State management untuk proses scanning
- Live detection dengan interval timer
- Image processing setelah capture

### 3. DocumentScanner Class (Updated)
Ditambahkan support untuk `HTMLVideoElement`:
- Konversi video frame ke canvas internal
- Proses deteksi tetap sama
- Cleanup temp canvas setelah selesai

## 🎯 Fitur Live Detection

### Cara Kerja:
1. User toggle "Live Detection: ON"
2. Setiap 500ms, system capture frame dari video
3. Frame diproses untuk deteksi dokumen
4. Jika ditemukan, tampilkan outline kuning + corner points
5. Overlay di-update real-time di atas video

### Manfaat:
- Feedback visual real-time
- User tahu kapan dokumen terdeteksi dengan baik
- Membantu positioning dokumen yang optimal

## 📊 Performa

### Optimisasi:
- Live detection: 500ms interval (2 FPS) untuk balance performa
- Canvas overlay: Redraws hanya saat perlu
- Video resolution: Optimal untuk mobile & desktop
- Memory cleanup: Proper disposal OpenCV matrices

### Browser Support:
- ✅ Chrome/Edge (Desktop & Mobile)
- ✅ Firefox (Desktop & Mobile)  
- ✅ Safari (Desktop & Mobile - iOS 11+)
- ✅ Samsung Internet
- ⚠️ Memerlukan HTTPS atau localhost untuk akses kamera

## 🔒 Permissions & Privacy

### Camera Access:
- Browser meminta permission saat pertama kali
- User harus allow akses kamera
- Kamera dapat dimatikan kapan saja
- Tidak ada data dikirim ke server (100% client-side)

### Privacy:
- ✅ Tidak ada upload ke server
- ✅ Tidak ada storage di cloud
- ✅ Semua processing di browser
- ✅ User kontrol penuh atas data

## 🚀 Teknologi yang Digunakan

### API & Libraries:
- **MediaDevices.getUserMedia()** - Akses kamera
- **Canvas API** - Drawing overlay & image processing
- **OpenCV.js** - Computer vision untuk deteksi
- **React Hooks** - State management

### React Patterns:
- Custom hooks (useCamera)
- useRef untuk DOM access
- useEffect untuk side effects
- useState untuk UI state

## 💡 Tips untuk Hasil Terbaik

### ✅ Do's:
- Gunakan pencahayaan yang baik
- Posisikan dokumen rata/flat
- Pastikan background kontras dengan dokumen
- Hindari bayangan
- Gunakan Live Detection untuk feedback

### ❌ Don'ts:
- Jangan scan di tempat gelap
- Hindari dokumen kusut/terlipat
- Jangan gunakan background yang ramai
- Hindari refleksi cahaya

## 🎨 Customization

### Mengubah Ukuran Guide:
```typescript
// Di CameraScanner.tsx, line ~45
const guideWidth = canvas.width * 0.8;  // 80% lebar
const guideHeight = canvas.height * 0.7; // 70% tinggi
```

### Mengubah Warna Guide:
```typescript
// Line ~60
ctx.strokeStyle = '#00ff00'; // Hijau (bisa diganti)
```

### Mengubah Interval Live Detection:
```typescript
// Line ~142
}, 500); // 500ms = 2 FPS (bisa dipercepat/diperlambat)
```

## 📦 File Structure

```
src/
├── hooks/
│   └── useCamera.ts              # Camera management hook
├── components/
│   ├── CameraScanner.tsx         # Main camera scanner (NEW)
│   └── DocumentScanner.tsx       # Original file upload version
├── lib/
│   └── document-scanner.ts       # OpenCV logic (updated for video)
└── App.tsx                        # Uses CameraScanner
```

## 🎉 Hasil Akhir

Aplikasi document scanner dengan:
- ✅ Input dari kamera real-time
- ✅ Overlay guide persegi panjang dengan corner markers
- ✅ Live detection opsional
- ✅ Capture, detect, crop, download workflow
- ✅ UI modern dengan Tailwind CSS
- ✅ Fully responsive (mobile & desktop)
- ✅ 100% client-side processing

Semua fitur yang diminta telah diimplementasi dengan baik! 🚀

