import React, { useState, useRef, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
}

export default function ResizablePanel({ children, defaultWidth = 33.33, minWidth = 15 }: Props) {
  const [width, setWidth] = useState(defaultWidth);
  const isDragging = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !panelRef.current) return;
      const container = panelRef.current.parentElement;
      if (!container) return;
      const newWidth = (e.clientX / container.offsetWidth) * 100;
      if (newWidth >= minWidth && newWidth <= 85) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minWidth]);

  return (
    <div ref={panelRef} style={{ width: `${width}%`, position: 'relative', overflow: 'hidden' }}>
      {children}
      <div
        onMouseDown={() => isDragging.current = true}
        style={{
          position: 'absolute',
          right: 0,
          top: 0,
          bottom: 0,
          width: '5px',
          cursor: 'col-resize',
          backgroundColor: 'transparent',
          zIndex: 10
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0078d4'}
        onMouseLeave={(e) => !isDragging.current && (e.currentTarget.style.backgroundColor = 'transparent')}
      />
    </div>
  );
}
