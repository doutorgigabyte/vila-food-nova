import React, { memo, useCallback, useRef, useState, useMemo } from 'react';

interface VirtualizedGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  rowHeight: number;
  columnCount: number;
  gap?: number;
  className?: string;
  containerHeight?: number;
  overscanRows?: number;
}

function VirtualizedGridInner<T>({
  items,
  renderItem,
  rowHeight,
  columnCount,
  gap = 16,
  className = '',
  containerHeight = 600,
  overscanRows = 2,
}: VirtualizedGridProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rowCount = Math.ceil(items.length / columnCount);
  const totalHeight = rowCount * (rowHeight + gap);
  
  const { startRow, endRow, visibleItems, offsetTop } = useMemo(() => {
    const visibleRowCount = Math.ceil(containerHeight / (rowHeight + gap));
    const rawStartRow = Math.floor(scrollTop / (rowHeight + gap));
    const startR = Math.max(0, rawStartRow - overscanRows);
    const endR = Math.min(rowCount - 1, rawStartRow + visibleRowCount + overscanRows);
    
    const startIdx = startR * columnCount;
    const endIdx = Math.min(items.length, (endR + 1) * columnCount);
    
    return {
      startRow: startR,
      endRow: endR,
      visibleItems: items.slice(startIdx, endIdx),
      offsetTop: startR * (rowHeight + gap)
    };
  }, [items, scrollTop, rowHeight, columnCount, containerHeight, overscanRows, rowCount, gap]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Group items into rows for rendering
  const rows = useMemo(() => {
    const result: T[][] = [];
    for (let i = 0; i < visibleItems.length; i += columnCount) {
      result.push(visibleItems.slice(i, i + columnCount));
    }
    return result;
  }, [visibleItems, columnCount]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: offsetTop, 
          left: 0, 
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: gap
        }}>
          {rows.map((row, rowIndex) => (
            <div 
              key={startRow + rowIndex}
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
                gap: gap,
                height: rowHeight
              }}
            >
              {row.map((item, colIndex) => {
                const globalIndex = (startRow + rowIndex) * columnCount + colIndex;
                return (
                  <div key={globalIndex} style={{ height: rowHeight }}>
                    {renderItem(item, globalIndex)}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const VirtualizedGrid = memo(VirtualizedGridInner) as typeof VirtualizedGridInner;

export default VirtualizedGrid;
