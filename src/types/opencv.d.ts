/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    cv: any;
    cvReady?: boolean;
  }
  var Module: {
    onRuntimeInitialized: () => void;
  };
}

export interface Point {
  x: number;
  y: number;
}

export {};

