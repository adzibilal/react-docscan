# Changelog

## [Latest] - Mobile & Upload Mode Fixes

### Fixed
- ✅ **Edge Detection not working in Upload Mode**
  - Added proper image loading state management
  - Canvas now waits for image to fully load before rendering
  - Added loading spinner while image is being loaded
  - Added error handling for image load failures

- ✅ **Mobile Touch Support**
  - Added full touch event handlers (onTouchStart, onTouchMove, onTouchEnd)
  - Increased touch target threshold from 20px to 35px for easier tapping
  - Increased corner handle size from 8px to 12px (14px when selected)
  - Added `touch-none` CSS class to prevent scrolling during adjustment
  - Added visual feedback when dragging (selected corner highlights)

- ✅ **UI Improvements**
  - Added real-time status indicator showing which corner is being adjusted
  - Improved instructions: "Tap and drag the corner points"
  - Added hint: "Touch and hold each blue circle to move it"
  - Made buttons responsive (full width on mobile, auto on desktop)
  - Added active states for better touch feedback

### Technical Changes
- Added `imageLoaded` state to track image loading
- Added `onLoad` and `onError` handlers to image element
- Canvas rendering now depends on `imageLoaded` flag
- Unified pointer handling for mouse and touch events
- Improved corner detection with visual feedback (glow effect)
- Better error logging for debugging

### Browser Support
- ✅ Desktop: Chrome, Firefox, Safari, Edge
- ✅ Mobile: iOS Safari, Chrome Mobile, Samsung Internet
- ✅ Tablet: iPad, Android tablets

### Performance
- No performance regression
- Canvas rendering optimized with proper state management
- Touch events properly throttled

