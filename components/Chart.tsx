import React, { useEffect, useState } from 'react';

export const Chart: React.FC = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial load animation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="chart-wrapper relative w-full max-w-[560px] h-[260px] mx-auto">

      <div className="chart-container">
        <svg
          viewBox="0 0 560 260"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <filter id="chart-dropshadow">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="0" dy="0" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA slope="0.2" type="linear" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <g className={`datasets ${isLoaded ? 'chart-loaded' : ''}`}>
            {/* Dataset 3 - Purple */}
            <path
              id="chart-dataset-3"
              className="chart-dataset"
              d="M0,260 C0,260 4,252 7,252 C66,252 90,102 139,102 C188,102 205,135 252,135 C299,135 309,89 330,89 C350,89 366,122 404,122 C442,122 431,98 451,98 C470,98 499,213 560,260 L0,259 Z"
              fill="#9F55FF"
              fillOpacity="0.8"
              filter="url(#chart-dropshadow)"
            />
            
            {/* Dataset 2 - Blue */}
            <path
              id="chart-dataset-2"
              className="chart-dataset"
              d="M0,260 C35,254 63,124 88,124 C114,124 148,163 219,163 C290,163 315,100 359,100 C402,100 520,244 560,259 C560,259 0,259 0,260 Z"
              fill="#5588FF"
              fillOpacity="0.8"
              filter="url(#chart-dropshadow)"
            />
            
            {/* Dataset 1 - Teal/Green */}
            <path
              id="chart-dataset-1"
              className="chart-dataset"
              d="M0,260 C0,260 22,199 64,199 C105,199 112,144 154,144 C195,144 194,126 216,126 C237,126 263,184 314,184 C365,183 386,128 434,129 C483,130 511,240 560,260 L0,260 Z"
              fill="#69F0C9"
              fillOpacity="0.8"
              filter="url(#chart-dropshadow)"
            />
          </g>
        </svg>
      </div>

      {/* X-axis label */}
      <div className="absolute bottom-0 left-0 right-0 text-secondary text-xs pt-2 flex justify-between px-0">
        <span>07:00h</span>
        <span>21:00h</span>
      </div>
    </div>
  );
};

