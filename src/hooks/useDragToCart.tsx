import { useState, useRef, useCallback } from 'react';

interface DragState {
  isDragging: boolean;
  draggedItem: any | null;
  ghostPosition: { x: number; y: number } | null;
}

export const useDragToCart = (onDropToCart: (item: any) => void) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    ghostPosition: null,
  });
  
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  
  // Check if point is over drop zone
  const isOverDropZone = useCallback((x: number, y: number): boolean => {
    if (!dropZoneRef.current) return false;
    const rect = dropZoneRef.current.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }, []);

  // Mouse/Desktop drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, item: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    setDragState({ isDragging: true, draggedItem: item, ghostPosition: null });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState({ isDragging: false, draggedItem: null, ghostPosition: null });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      const item = JSON.parse(data);
      onDropToCart(item);
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error('Drop error:', error);
    }
    setDragState({ isDragging: false, draggedItem: null, ghostPosition: null });
  }, [onDropToCart]);

  // Touch handlers for mobile/tablet
  const handleTouchStart = useCallback((e: React.TouchEvent, item: any) => {
    const touch = e.touches[0];
    setDragState({
      isDragging: true,
      draggedItem: item,
      ghostPosition: { x: touch.clientX, y: touch.clientY },
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragState.isDragging) return;
    
    const touch = e.touches[0];
    setDragState(prev => ({
      ...prev,
      ghostPosition: { x: touch.clientX, y: touch.clientY },
    }));

    // Check if over drop zone and add visual feedback
    if (dropZoneRef.current) {
      const isOver = isOverDropZone(touch.clientX, touch.clientY);
      dropZoneRef.current.classList.toggle('ring-2', isOver);
      dropZoneRef.current.classList.toggle('ring-primary', isOver);
      dropZoneRef.current.classList.toggle('bg-primary/10', isOver);
    }
  }, [dragState.isDragging, isOverDropZone]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!dragState.isDragging || !dragState.draggedItem) {
      setDragState({ isDragging: false, draggedItem: null, ghostPosition: null });
      return;
    }

    const touch = e.changedTouches[0];
    
    // Remove visual feedback
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('ring-2', 'ring-primary', 'bg-primary/10');
    }

    // Check if dropped on cart
    if (isOverDropZone(touch.clientX, touch.clientY)) {
      onDropToCart(dragState.draggedItem);
      
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }

    setDragState({ isDragging: false, draggedItem: null, ghostPosition: null });
  }, [dragState, isOverDropZone, onDropToCart]);

  return {
    dragState,
    dropZoneRef,
    ghostRef,
    handlers: {
      // Desktop drag
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
      // Touch drag
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
};
