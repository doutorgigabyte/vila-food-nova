import { useRef, useState, useCallback, useEffect } from "react";

interface UseDragScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
  friction?: number;
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { 
    sensitivity = 1, 
    momentum = true, 
    friction = 0.92,
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const state = useRef({
    isMouseDown: false,
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocity: 0,
    hasMoved: false,
    animationId: 0,
  });

  const cancelMomentum = useCallback(() => {
    if (state.current.animationId) {
      cancelAnimationFrame(state.current.animationId);
      state.current.animationId = 0;
    }
  }, []);

  const applyMomentum = useCallback(() => {
    if (!momentum || !scrollRef.current) return;
    
    let velocity = state.current.velocity;
    
    if (Math.abs(velocity) < 0.5) return;
    
    const animate = () => {
      if (!scrollRef.current) return;
      
      velocity *= friction;
      
      if (Math.abs(velocity) < 0.1) {
        state.current.animationId = 0;
        return;
      }
      
      scrollRef.current.scrollLeft -= velocity;
      state.current.animationId = requestAnimationFrame(animate);
    };
    
    state.current.animationId = requestAnimationFrame(animate);
  }, [momentum, friction]);

  // Mouse events only - let mobile use native scroll
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const s = state.current;
      if (!s.isMouseDown || !scrollRef.current) return;
      
      e.preventDefault();
      
      const now = performance.now();
      const dt = Math.max(now - s.lastTime, 1);
      const dx = e.clientX - s.lastX;
      
      // Calculate velocity
      s.velocity = (dx / dt) * 16 * sensitivity;
      
      // Apply scroll
      const delta = (s.startX - e.clientX) * sensitivity;
      scrollRef.current.scrollLeft = s.scrollLeft + delta;
      
      if (Math.abs(delta) > 3) {
        s.hasMoved = true;
        setIsDragging(true);
      }
      
      s.lastX = e.clientX;
      s.lastTime = now;
    };

    const handleMouseUp = () => {
      const s = state.current;
      if (!s.isMouseDown) return;
      
      s.isMouseDown = false;
      setIsDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      if (s.hasMoved && momentum) {
        applyMomentum();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelMomentum();
    };
  }, [sensitivity, momentum, applyMomentum, cancelMomentum]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0 || !scrollRef.current) return;
    
    cancelMomentum();
    
    const s = state.current;
    s.isMouseDown = true;
    s.startX = e.clientX;
    s.scrollLeft = scrollRef.current.scrollLeft;
    s.lastX = e.clientX;
    s.lastTime = performance.now();
    s.velocity = 0;
    s.hasMoved = false;
    
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, [cancelMomentum]);

  const scroll = useCallback((dir: "left" | "right", amount = 300) => {
    if (!scrollRef.current) return;
    
    cancelMomentum();
    
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, [cancelMomentum]);

  const wasClick = useCallback(() => !state.current.hasMoved, []);

  // CSS styles for native mobile scrolling
  const scrollStyles: React.CSSProperties = {
    WebkitOverflowScrolling: 'touch',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  };

  return {
    scrollRef,
    isDragging,
    wasClick,
    scrollStyles,
    handlers: {
      onMouseDown,
    },
    scroll,
  };
};

export default useDragScroll;
