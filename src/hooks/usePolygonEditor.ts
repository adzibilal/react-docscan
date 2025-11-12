import { useState, useRef, useEffect } from 'react';
import type { Point } from '../types/opencv';

interface UsePolygonEditorProps {
  points: Point[];
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  imageRef: React.RefObject<HTMLImageElement | null>;
  onPointsChange: (points: Point[]) => void;
}

export function usePolygonEditor({
  points,
  canvasRef,
  imageRef,
  onPointsChange
}: UsePolygonEditorProps) {
  const [draggedPointIndex, setDraggedPointIndex] = useState<number | null>(null);
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const scaleRef = useRef({ x: 1, y: 1 });

  // Calculate if a point is near the mouse position
  const isNearPoint = (mouseX: number, mouseY: number, point: Point, threshold = 20): boolean => {
    const dx = mouseX - point.x * scaleRef.current.x;
    const dy = mouseY - point.y * scaleRef.current.y;
    return Math.sqrt(dx * dx + dy * dy) < threshold;
  };

  // Get mouse position relative to canvas
  const getMousePos = (canvas: HTMLCanvasElement, evt: MouseEvent | TouchEvent): { x: number; y: number } => {
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in evt ? evt.touches[0].clientX : evt.clientX;
    const clientY = 'touches' in evt ? evt.touches[0].clientY : evt.clientY;
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Handle mouse/touch down
  const handlePointerDown = (evt: MouseEvent | TouchEvent) => {
    if (!canvasRef.current || points.length !== 4) return;

    const pos = getMousePos(canvasRef.current, evt);
    
    // Check if clicking near any point
    for (let i = 0; i < points.length; i++) {
      if (isNearPoint(pos.x, pos.y, points[i])) {
        setDraggedPointIndex(i);
        evt.preventDefault();
        break;
      }
    }
  };

  // Handle mouse/touch move
  const handlePointerMove = (evt: MouseEvent | TouchEvent) => {
    if (!canvasRef.current || points.length !== 4) return;

    const pos = getMousePos(canvasRef.current, evt);

    if (draggedPointIndex !== null) {
      // Update dragged point position
      const newPoints = [...points];
      newPoints[draggedPointIndex] = {
        x: pos.x / scaleRef.current.x,
        y: pos.y / scaleRef.current.y
      };
      onPointsChange(newPoints);
      evt.preventDefault();
    } else {
      // Check hover state
      let hoveredIndex: number | null = null;
      for (let i = 0; i < points.length; i++) {
        if (isNearPoint(pos.x, pos.y, points[i])) {
          hoveredIndex = i;
          break;
        }
      }
      setHoveredPointIndex(hoveredIndex);
    }
  };

  // Handle mouse/touch up
  const handlePointerUp = () => {
    setDraggedPointIndex(null);
  };

  // Update scale factor when canvas size changes
  useEffect(() => {
    if (canvasRef.current && imageRef.current) {
      const canvas = canvasRef.current;
      const image = imageRef.current;
      
      scaleRef.current = {
        x: canvas.offsetWidth / image.naturalWidth,
        y: canvas.offsetHeight / image.naturalHeight
      };
    }
  }, [canvasRef.current, imageRef.current, points]);

  // Add event listeners
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Mouse events
    canvas.addEventListener('mousedown', handlePointerDown as EventListener);
    canvas.addEventListener('mousemove', handlePointerMove as EventListener);
    canvas.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerUp);

    // Touch events
    canvas.addEventListener('touchstart', handlePointerDown as EventListener);
    canvas.addEventListener('touchmove', handlePointerMove as EventListener);
    canvas.addEventListener('touchend', handlePointerUp);
    canvas.addEventListener('touchcancel', handlePointerUp);

    return () => {
      canvas.removeEventListener('mousedown', handlePointerDown as EventListener);
      canvas.removeEventListener('mousemove', handlePointerMove as EventListener);
      canvas.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerUp);
      canvas.removeEventListener('touchstart', handlePointerDown as EventListener);
      canvas.removeEventListener('touchmove', handlePointerMove as EventListener);
      canvas.removeEventListener('touchend', handlePointerUp);
      canvas.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [points, draggedPointIndex]);

  return {
    draggedPointIndex,
    hoveredPointIndex,
    isDragging: draggedPointIndex !== null
  };
}

