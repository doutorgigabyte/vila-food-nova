import { useRef, useState, useCallback, useEffect } from "react";

interface UseDragScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
  direction?: "horizontal" | "vertical" | "both";
  friction?: number;
  velocityMultiplier?: number;
  snapThreshold?: number;
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { 
    sensitivity = 1, 
    momentum = true, 
    direction = "horizontal",
    friction = 0.92,
    velocityMultiplier = 1,
    snapThreshold = 10,
  } = options;

  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const state = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    lastX: 0,
    lastY: 0,
    lastTime: 0,
    velocityX: 0,
    velocityY: 0,
    hasMoved: false,
    animationId: 0,
    touchId: null as number | null,
    isHorizontalScroll: false,
    directionDetermined: false,
  });

  const cancelMomentum = useCallback(() => {
    if (state.current.animationId) {
      cancelAnimationFrame(state.current.animationId);
      state.current.animationId = 0;
    }
  }, []);

  const applyMomentum = useCallback(() => {
    if (!momentum || !scrollRef.current) return;
    
    let vx = state.current.velocityX * velocityMultiplier;
    let vy = state.current.velocityY * velocityMultiplier;
    
    const minVelocity = 0.3;
    if (Math.abs(vx) < minVelocity && Math.abs(vy) < minVelocity) return;
    
    const animate = () => {
      if (!scrollRef.current) return;
      
      vx *= friction;
      vy *= friction;
      
      if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
        state.current.animationId = 0;
        return;
      }
      
      if (direction === "horizontal" || direction === "both") {
        scrollRef.current.scrollLeft -= vx;
      }
      if (direction === "vertical" || direction === "both") {
        scrollRef.current.scrollTop -= vy;
      }
      
      state.current.animationId = requestAnimationFrame(animate);
    };
    
    state.current.animationId = requestAnimationFrame(animate);
  }, [momentum, friction, direction, velocityMultiplier]);

  const startDrag = useCallback((clientX: number, clientY: number, touchId?: number) => {
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
    s.velocityX = 0;
    s.velocityY = 0;
    s.hasMoved = false;
    s.touchId = touchId ?? null;
    s.isHorizontalScroll = false;
    s.directionDetermined = false;
  }, [cancelMomentum]);

  const moveDrag = useCallback((clientX: number, clientY: number, event?: TouchEvent) => {
    const s = state.current;
    if (!s.isActive || !scrollRef.current) return;
    
    const now = performance.now();
    const dt = Math.max(now - s.lastTime, 1);
    
    const deltaX = clientX - s.startX;
    const deltaY = clientY - s.startY;
    
    // Determine scroll direction on first significant movement
    if (!s.directionDetermined && (Math.abs(deltaX) > snapThreshold || Math.abs(deltaY) > snapThreshold)) {
      s.directionDetermined = true;
      s.isHorizontalScroll = Math.abs(deltaX) > Math.abs(deltaY);
      
      if (s.isHorizontalScroll) {
        setIsDragging(true);
      }
    }
    
    // If vertical scroll detected, let browser handle it
    if (s.directionDetermined && !s.isHorizontalScroll) {
      s.isActive = false;
      return;
    }
    
    // Prevent vertical scroll only when horizontal scrolling is confirmed
    if (s.isHorizontalScroll && event) {
      event.preventDefault();
    }
    
    // Calculate velocity
    const moveDeltaX = clientX - s.lastX;
    const moveDeltaY = clientY - s.lastY;
    
    // Smooth velocity calculation
    const alpha = 0.3;
    s.velocityX = alpha * (moveDeltaX / dt * 16) + (1 - alpha) * s.velocityX;
    s.velocityY = alpha * (moveDeltaY / dt * 16) + (1 - alpha) * s.velocityY;
    
    // Cap velocity
    const maxVel = 30;
    s.velocityX = Math.max(-maxVel, Math.min(maxVel, s.velocityX));
    s.velocityY = Math.max(-maxVel, Math.min(maxVel, s.velocityY));
    
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      s.hasMoved = true;
    }
    
    // Apply scroll
    if (s.isHorizontalScroll && (direction === "horizontal" || direction === "both")) {
      scrollRef.current.scrollLeft = s.scrollLeft - deltaX * sensitivity;
    }
    if (!s.isHorizontalScroll && (direction === "vertical" || direction === "both")) {
      scrollRef.current.scrollTop = s.scrollTop - deltaY * sensitivity;
    }
    
    s.lastX = clientX;
    s.lastY = clientY;
    s.lastTime = now;
  }, [sensitivity, direction, snapThreshold]);

  const endDrag = useCallback(() => {
    const s = state.current;
    if (!s.isActive && !isDragging) return;
    
    s.isActive = false;
    s.touchId = null;
    setIsDragging(false);
    
    if (s.hasMoved && s.isHorizontalScroll && momentum) {
      applyMomentum();
    }
    
    s.directionDetermined = false;
    s.isHorizontalScroll = false;
  }, [momentum, applyMomentum, isDragging]);

  // Mouse events
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!state.current.isActive) return;
      moveDrag(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endDrag();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelMomentum();
    };
  }, [moveDrag, endDrag, cancelMomentum]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY, touch.identifier);
  }, [startDrag]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const s = state.current;
    
    let touch: React.Touch | null = null;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === s.touchId) {
        touch = e.touches[i];
        break;
      }
    }
    
    if (!touch) return;
    
    moveDrag(touch.clientX, touch.clientY, e.nativeEvent);
  }, [moveDrag]);

  const onTouchEnd = useCallback((e: React.TouchEvent) => {
    const s = state.current;
    
    let touchEnded = true;
    for (let i = 0; i < e.touches.length; i++) {
      if (e.touches[i].identifier === s.touchId) {
        touchEnded = false;
        break;
      }
    }
    
    if (touchEnded) {
      endDrag();
    }
  }, [endDrag]);

  const scroll = useCallback((dir: "left" | "right", amount = 300) => {
    if (!scrollRef.current) return;
    
    cancelMomentum();
    
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, [cancelMomentum]);

  const wasClick = useCallback(() => !state.current.hasMoved, []);

  // Style object to apply to scrollable container
  const scrollStyles: React.CSSProperties = {
    touchAction: 'pan-y pinch-zoom',
    WebkitOverflowScrolling: 'touch',
    overscrollBehaviorX: 'contain',
  };

  return {
    scrollRef,
    isDragging,
    wasClick,
    scrollStyles,
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
