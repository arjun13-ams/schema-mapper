import React, { useState, useRef, useEffect } from 'react';

interface Props {
  children: React.ReactNode;
  defaultHeight?: number;
  minHeight?: number;
}

export default function ResizablePanelVertical({ children, defaultHeight = 50, minHeight = 20 }: Props) {
  const [height, setHeight] = useState(defaultHeight);
  const isDragging = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !panelRef.current) return;
      const container = panelRef.current.parentElement;
      if (!container) return;
      const newHeight = (e.clientY / container.offsetHeight) * 100;
      if (newHeight >= minHeight && newHeight <= 80) {
        setHeight(newHeight);
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
  }, [minHeight]);

  return (
    <div ref={panelRef} style={{ height: `${height}%`, position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
      <div
        onMouseDown={() => isDragging.current = true}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '5px',
          cursor: 'row-resize',
          backgroundColor: 'transparent',
          zIndex: 10
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0078d4'}
        onMouseLeave={(e) => !isDragging.current && (e.currentTarget.style.backgroundColor = 'transparent')}
      />
    </div>
  );
}
