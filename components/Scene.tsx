import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const randomColors = (count: number) => {
  return new Array(count)
    .fill(0)
    .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
};

export const Scene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Expose THREE globally for the library to use
    // @ts-ignore
    window.THREE = THREE;

    let app: any = null;
    let handleClick: (() => void) | null = null;

    const init = async () => {
      if (!canvasRef.current) return;

      try {
        // Dynamic import to load the module from CDN
        // @ts-ignore
        const module = await import('https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js');
        const TubesCursor = module.default;

        app = TubesCursor(canvasRef.current, {
          tubes: {
            colors: ["#f967fb", "#53bc28", "#6958d5"],
            lights: {
              intensity: 200,
              colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
            }
          }
        });

        handleClick = () => {
          if (app && app.tubes) {
            const colors = randomColors(3);
            const lightsColors = randomColors(4);
            app.tubes.setColors(colors);
            app.tubes.setLightsColors(lightsColors);
          }
        };

        window.addEventListener('click', handleClick);

      } catch (error) {
        console.error("Failed to initialize TubesCursor", error);
      }
    };

    init();

    return () => {
      if (handleClick) window.removeEventListener('click', handleClick);
      // Attempt cleanup if supported
      try {
        if (app && typeof app.dispose === 'function') {
          app.dispose();
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
      <canvas 
        ref={canvasRef} 
        className="block w-full h-full"
      />
    </div>
  );
};