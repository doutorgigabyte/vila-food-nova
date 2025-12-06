import { useRef, useState, useCallback, useEffect } from "react";

interface UseDragScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
  direction?: "horizontal" | "vertical" | "both";
  friction?: number;
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { 
    sensitivity = 1, 
    momentum = true, 
    direction = "horizontal",
    friction = 0.95 
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // All state in a single ref to avoid stale closures
  const state = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityHistory: [] as { vx: number; vy: number }[],
    hasMoved: false,
    animationId: 0,
  });

  // Cancel momentum animation
  const cancelMomentum = useCallback(() => {
    if (state.current.animationId) {
      cancelAnimationFrame(state.current.animationId);
      state.current.animationId = 0;
    }
  }, []);

  // Apply momentum with smooth deceleration
  const applyMomentum = useCallback(() => {
    if (!momentum || !scrollRef.current) return;
    
    const history = state.current.velocityHistory;
    if (history.length < 2) return;
    
    // Calculate average velocity from last samples
    const samples = history.slice(-5);
    let avgVx = 0;
    let avgVy = 0;
    
    samples.forEach(s => {
      avgVx += s.vx;
      avgVy += s.vy;
    });
    
    avgVx = (avgVx / samples.length) * sensitivity * 12;
    avgVy = (avgVy / samples.length) * sensitivity * 12;
    
    // Minimum velocity threshold
    if (Math.abs(avgVx) < 1 && Math.abs(avgVy) < 1) return;
    
    let vx = avgVx;
    let vy = avgVy;
    
    const animate = () => {
      if (!scrollRef.current) return;
      
      // Apply friction
      vx *= friction;
      vy *= friction;
      
      // Stop when velocity is very small
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        state.current.animationId = 0;
        return;
      }
      
      // Apply scroll
      if (direction === "horizontal" || direction === "both") {
        scrollRef.current.scrollLeft -= vx;
      }
      if (direction === "vertical" || direction === "both") {
        scrollRef.current.scrollTop -= vy;
      }
      
      state.current.animationId = requestAnimationFrame(animate);
    };
    
    state.current.animationId = requestAnimationFrame(animate);
  }, [momentum, sensitivity, friction, direction]);

  // Handle drag start (works for both mouse and touch)
  const startDrag = useCallback((clientX: number, clientY: number) => {
    if (!scrollRef.current) return;
    
    cancelMomentum();
    
    const s = state.current;
    s.isActive = true;
    s.startX = clientX;
    s.startY = clientY;
    s.scrollLeft = scrollRef.current.scrollLeft;
    s.scrollTop = scrollRef.current.scrollTop;
    s.lastX = clientX;
    s.lastY = clientY;
    s.lastTime = performance.now();
    s.velocityHistory = [];
    s.hasMoved = false;
    
    setIsDragging(true);
    
    // Global styles to prevent selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    document.body.style.webkitUserSelect = 'none';
  }, [cancelMomentum]);

  // Handle drag move
  const moveDrag = useCallback((clientX: number, clientY: number) => {
    const s = state.current;
    if (!s.isActive || !scrollRef.current) return;
    
    const now = performance.now();
    const dt = Math.max(now - s.lastTime, 1); // Prevent division by zero
    
    // Calculate velocity and store in history
    const vx = (clientX - s.lastX) / dt * 16; // Normalize to ~60fps
    const vy = (clientY - s.lastY) / dt * 16;
    
    s.velocityHistory.push({ vx, vy });
    if (s.velocityHistory.length > 10) {
      s.velocityHistory.shift();
    }
    
    // Calculate total delta from start
    const deltaX = (s.startX - clientX) * sensitivity;
    const deltaY = (s.startY - clientY) * sensitivity;
    
    // Mark as moved if threshold exceeded
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      s.hasMoved = true;
    }
    
    // Apply scroll
    if (direction === "horizontal" || direction === "both") {
      scrollRef.current.scrollLeft = s.scrollLeft + deltaX;
    }
    if (direction === "vertical" || direction === "both") {
      scrollRef.current.scrollTop = s.scrollTop + deltaY;
    }
    
    s.lastX = clientX;
    s.lastY = clientY;
    s.lastTime = now;
  }, [sensitivity, direction]);

  // Handle drag end
  const endDrag = useCallback(() => {
    const s = state.current;
    if (!s.isActive) return;
    
    s.isActive = false;
    setIsDragging(false);
    
    // Restore body styles
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    document.body.style.webkitUserSelect = '';
    
    // Apply momentum if moved
    if (s.hasMoved && momentum) {
      applyMomentum();
    }
  }, [momentum, applyMomentum]);

  // Global mouse event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!state.current.isActive) return;
      e.preventDefault();
      moveDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    // Add listeners to window for global capture
    window.addEventListener('mousemove', handleMouseMove, { passive: false });
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelMomentum();
      // Clean up body styles on unmount
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.body.style.webkitUserSelect = '';
    };
  }, [moveDrag, endDrag, cancelMomentum]);

  // Mouse down handler (attach to element)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  // Touch handlers
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  }, [startDrag]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    moveDrag(touch.clientX, touch.clientY);
  }, [moveDrag]);

  const onTouchEnd = useCallback(() => {
    endDrag();
  }, [endDrag]);

  // Scroll programmatically
  const scroll = useCallback((dir: "left" | "right", amount = 300) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  // Check if the last interaction was a drag (not a click)
  const wasClick = useCallback(() => !state.current.hasMoved, []);

  return {
    scrollRef,
    isDragging,
    wasClick,
    handlers: {
      onMouseDown,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    scroll,
  };
};

export default useDragScroll;
