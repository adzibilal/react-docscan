/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Point } from '../types/opencv';

export class DocumentScanner {
  private cv: any;

  constructor() {
    if (!window.cv) {
      throw new Error("OpenCV not found. Make sure opencv.js is loaded.");
    }
    this.cv = window.cv;
  }

  /**
   * Calculate Euclidean distance between two points
   */
  private distance(p1: Point, p2: Point): number {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
  }

  /**
   * Extract the four corner points from a contour
   * Returns points in clockwise order: top-left, top-right, bottom-right, bottom-left
   */
  private getCornerPoints(contour: any): Point[] {
    const cv = this.cv;
    const rect = cv.minAreaRect(contour);
    const center = rect.center;

    let topLeftPoint: Point | undefined;
    let topLeftDistance = 0;
    let topRightPoint: Point | undefined;
    let topRightDistance = 0;
    let bottomLeftPoint: Point | undefined;
    let bottomLeftDistance = 0;
    let bottomRightPoint: Point | undefined;
    let bottomRightDistance = 0;

    // Iterate through all points in the contour
    for (let i = 0; i < contour.data32S.length; i += 2) {
      const point: Point = {
        x: contour.data32S[i],
        y: contour.data32S[i + 1]
      };
      const distance = this.distance(point, center);

      // Determine which quadrant the point is in relative to center
      if (point.x < center.x && point.y < center.y) {
        // Top-left quadrant
        if (distance > topLeftDistance) {
          topLeftPoint = point;
          topLeftDistance = distance;
        }
      } else if (point.x > center.x && point.y < center.y) {
        // Top-right quadrant
        if (distance > topRightDistance) {
          topRightPoint = point;
          topRightDistance = distance;
        }
      } else if (point.x < center.x && point.y > center.y) {
        // Bottom-left quadrant
        if (distance > bottomLeftDistance) {
          bottomLeftPoint = point;
          bottomLeftDistance = distance;
        }
      } else if (point.x > center.x && point.y > center.y) {
        // Bottom-right quadrant
        if (distance > bottomRightDistance) {
          bottomRightPoint = point;
          bottomRightDistance = distance;
        }
      }
    }

    // Return points in clockwise order
    const points: Point[] = [];
    if (topLeftPoint) points.push(topLeftPoint);
    if (topRightPoint) points.push(topRightPoint);
    if (bottomRightPoint) points.push(bottomRightPoint);
    if (bottomLeftPoint) points.push(bottomLeftPoint);

    return points;
  }

  /**
   * Detect document boundaries in an image
   * Returns the four corner points of the detected document
   */
  detect(source: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement): Point[] {
    const cv = this.cv;

    // Convert video element to canvas if needed
    let imageSource: HTMLImageElement | HTMLCanvasElement = source as HTMLImageElement | HTMLCanvasElement;
    let tempCanvas: HTMLCanvasElement | null = null;
    
    if (source instanceof HTMLVideoElement) {
      tempCanvas = document.createElement('canvas');
      tempCanvas.width = source.videoWidth;
      tempCanvas.height = source.videoHeight;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(source, 0, 0);
      }
      imageSource = tempCanvas;
    }

    // Read the image
    const img = cv.imread(imageSource);

    // Convert to grayscale
    const gray = new cv.Mat();
    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur to reduce noise
    const blur = new cv.Mat();
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // Apply threshold to get binary image
    const thresh = new cv.Mat();
    cv.threshold(blur, thresh, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);

    // Find contours
    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(
      thresh,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );

    // Find the largest contour (assumed to be the document)
    let maxArea = 0;
    let maxContourIndex = -1;
    for (let i = 0; i < contours.size(); i++) {
      const contourArea = cv.contourArea(contours.get(i));
      if (contourArea > maxArea) {
        maxArea = contourArea;
        maxContourIndex = i;
      }
    }

    let points: Point[] = [];
    if (maxContourIndex !== -1) {
      const maxContour = contours.get(maxContourIndex);
      points = this.getCornerPoints(maxContour);
    }

    // Clean up
    img.delete();
    gray.delete();
    blur.delete();
    thresh.delete();
    contours.delete();
    hierarchy.delete();
    
    // Clean up temp canvas if created
    if (tempCanvas) {
      tempCanvas.remove();
    }

    return points;
  }

  /**
   * Apply perspective transformation to crop and straighten the document
   */
  warp(
    source: HTMLImageElement | HTMLCanvasElement,
    points: Point[]
  ): string {
    if (points.length !== 4) {
      throw new Error("Exactly 4 points are required for perspective transformation");
    }

    const cv = this.cv;
    const img = cv.imread(source);

    // Calculate the width and height of the output image
    const widthTop = this.distance(points[0], points[1]);
    const widthBottom = this.distance(points[2], points[3]);
    const width = Math.max(widthTop, widthBottom);

    const heightLeft = this.distance(points[0], points[3]);
    const heightRight = this.distance(points[1], points[2]);
    const height = Math.max(heightLeft, heightRight);

    // Source points (the four corners of the document)
    const srcPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      points[0].x, points[0].y, // top-left
      points[1].x, points[1].y, // top-right
      points[2].x, points[2].y, // bottom-right
      points[3].x, points[3].y  // bottom-left
    ]);

    // Destination points (rectangle corners)
    const dstPoints = cv.matFromArray(4, 1, cv.CV_32FC2, [
      0, 0,              // top-left
      width, 0,          // top-right
      width, height,     // bottom-right
      0, height          // bottom-left
    ]);

    // Get perspective transformation matrix
    const M = cv.getPerspectiveTransform(srcPoints, dstPoints);

    // Apply perspective transformation
    const warped = new cv.Mat();
    cv.warpPerspective(
      img,
      warped,
      M,
      new cv.Size(width, height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );

    // Convert to canvas and get data URL
    const canvas = document.createElement('canvas');
    cv.imshow(canvas, warped);
    const dataURL = canvas.toDataURL();

    // Clean up
    img.delete();
    srcPoints.delete();
    dstPoints.delete();
    M.delete();
    warped.delete();

    return dataURL;
  }
}

