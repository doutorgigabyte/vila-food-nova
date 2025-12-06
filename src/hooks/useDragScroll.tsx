import { useRef, useState, useCallback, useEffect } from "react";

interface UseDragScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
  direction?: "horizontal" | "vertical" | "both";
  friction?: number;
  // New options for better mobile experience
  velocityMultiplier?: number;
  snapThreshold?: number;
  preventVerticalScroll?: boolean;
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { 
    sensitivity = 1, 
    momentum = true, 
    direction = "horizontal",
    friction = 0.92,
    velocityMultiplier = 0.8,
    snapThreshold = 8,
    preventVerticalScroll = true
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
    velocityX: 0,
    velocityY: 0,
    hasMoved: false,
    animationId: 0,
    touchId: null as number | null,
    // Track if we've determined direction (for locking)
    directionLocked: false,
    lockedDirection: null as "horizontal" | "vertical" | null,
    // Smoothing for velocity
    velocitySamples: [] as { x: number; y: number; t: number }[],
  });

  // Cancel momentum animation
  const cancelMomentum = useCallback(() => {
    if (state.current.animationId) {
      cancelAnimationFrame(state.current.animationId);
      state.current.animationId = 0;
    }
  }, []);

  // Calculate smoothed velocity from samples
  const getSmoothedVelocity = useCallback(() => {
    const samples = state.current.velocitySamples;
    if (samples.length < 2) return { vx: 0, vy: 0 };
    
    // Use exponential weighted moving average for smoother velocity
    let vx = 0;
    let vy = 0;
    let weight = 0;
    
    for (let i = 1; i < samples.length; i++) {
      const prev = samples[i - 1];
      const curr = samples[i];
      const dt = Math.max(curr.t - prev.t, 1);
      
      // Calculate instantaneous velocity
      const ivx = (curr.x - prev.x) / dt;
      const ivy = (curr.y - prev.y) / dt;
      
      // Exponential weight (recent samples matter more)
      const w = Math.pow(2, i);
      vx += ivx * w;
      vy += ivy * w;
      weight += w;
    }
    
    if (weight > 0) {
      vx = (vx / weight) * 16; // Normalize to ~60fps
      vy = (vy / weight) * 16;
    }
    
    // Apply velocity cap to prevent too fast momentum
    const maxVelocity = 25;
    vx = Math.max(-maxVelocity, Math.min(maxVelocity, vx));
    vy = Math.max(-maxVelocity, Math.min(maxVelocity, vy));
    
    return { vx, vy };
  }, []);

  // Apply momentum with smooth deceleration using easing
  const applyMomentum = useCallback(() => {
    if (!momentum || !scrollRef.current) return;
    
    const { vx: rawVx, vy: rawVy } = getSmoothedVelocity();
    
    // Apply multiplier for controlled speed
    let vx = rawVx * velocityMultiplier * sensitivity;
    let vy = rawVy * velocityMultiplier * sensitivity;
    
    // Minimum velocity threshold to start momentum
    const minVelocity = 0.5;
    if (Math.abs(vx) < minVelocity && Math.abs(vy) < minVelocity) return;
    
    // Use locked direction if available
    const lockedDir = state.current.lockedDirection;
    if (lockedDir === "horizontal") vy = 0;
    if (lockedDir === "vertical") vx = 0;
    
    const animate = () => {
      if (!scrollRef.current) return;
      
      // Apply smooth friction (cubic ease-out feel)
      vx *= friction;
      vy *= friction;
      
      // Stop when velocity is very small
      if (Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05) {
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
  }, [momentum, sensitivity, friction, direction, velocityMultiplier, getSmoothedVelocity]);

  // Handle drag start (works for both mouse and touch)
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
    s.velocitySamples = [{ x: clientX, y: clientY, t: performance.now() }];
    s.hasMoved = false;
    s.touchId = touchId ?? null;
    s.directionLocked = false;
    s.lockedDirection = null;
    
    setIsDragging(true);
    
    // Global styles to prevent selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  }, [cancelMomentum]);

  // Handle drag move
  const moveDrag = useCallback((clientX: number, clientY: number, event?: TouchEvent) => {
    const s = state.current;
    if (!s.isActive || !scrollRef.current) return;
    
    const now = performance.now();
    
    // Add sample for velocity calculation
    s.velocitySamples.push({ x: clientX, y: clientY, t: now });
    // Keep only last 6 samples for smooth calculation
    if (s.velocitySamples.length > 6) {
      s.velocitySamples.shift();
    }
    
    // Calculate delta from start
    const totalDeltaX = clientX - s.startX;
    const totalDeltaY = clientY - s.startY;
    
    // Determine scroll direction lock on first significant movement
    if (!s.directionLocked && (Math.abs(totalDeltaX) > snapThreshold || Math.abs(totalDeltaY) > snapThreshold)) {
      s.directionLocked = true;
      
      // Lock to the dominant direction
      if (Math.abs(totalDeltaX) > Math.abs(totalDeltaY) * 1.2) {
        s.lockedDirection = "horizontal";
      } else if (Math.abs(totalDeltaY) > Math.abs(totalDeltaX) * 1.2) {
        s.lockedDirection = "vertical";
      } else {
        // Ambiguous - use configured direction preference
        s.lockedDirection = direction === "both" ? null : direction;
      }
    }
    
    // If direction is locked and we're horizontal, prevent default to stop page scroll
    if (s.lockedDirection === "horizontal" && preventVerticalScroll && event) {
      event.preventDefault();
    }
    
    // Calculate scroll amounts based on locked direction
    let scrollDeltaX = 0;
    let scrollDeltaY = 0;
    
    if (!s.directionLocked) {
      // Not locked yet - calculate both
      scrollDeltaX = (s.startX - clientX) * sensitivity;
      scrollDeltaY = (s.startY - clientY) * sensitivity;
    } else if (s.lockedDirection === "horizontal") {
      scrollDeltaX = (s.startX - clientX) * sensitivity;
    } else if (s.lockedDirection === "vertical") {
      scrollDeltaY = (s.startY - clientY) * sensitivity;
    } else {
      // Both directions
      scrollDeltaX = (s.startX - clientX) * sensitivity;
      scrollDeltaY = (s.startY - clientY) * sensitivity;
    }
    
    // Mark as moved if threshold exceeded
    if (Math.abs(scrollDeltaX) > 3 || Math.abs(scrollDeltaY) > 3) {
      s.hasMoved = true;
    }
    
    // Apply scroll smoothly
    if ((direction === "horizontal" || direction === "both") && s.lockedDirection !== "vertical") {
      scrollRef.current.scrollLeft = s.scrollLeft + scrollDeltaX;
    }
    if ((direction === "vertical" || direction === "both") && s.lockedDirection !== "horizontal") {
      scrollRef.current.scrollTop = s.scrollTop + scrollDeltaY;
    }
    
    s.lastX = clientX;
    s.lastY = clientY;
    s.lastTime = now;
  }, [sensitivity, direction, snapThreshold, preventVerticalScroll]);

  // Handle drag end
  const endDrag = useCallback(() => {
    const s = state.current;
    if (!s.isActive) return;
    
    s.isActive = false;
    s.touchId = null;
    setIsDragging(false);
    
    // Restore body styles
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    
    // Apply momentum if moved
    if (s.hasMoved && momentum) {
      applyMomentum();
    }
    
    // Reset direction lock after a short delay
    setTimeout(() => {
      s.directionLocked = false;
      s.lockedDirection = null;
    }, 50);
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
      document.body.style.webkitUserSelect = '';
    };
  }, [moveDrag, endDrag, cancelMomentum]);

  // Mouse down handler (attach to element)
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault();
    startDrag(e.clientX, e.clientY);
  }, [startDrag]);

  // Touch handlers with improved tracking
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    // Only handle single touch
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY, touch.identifier);
  }, [startDrag]);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const s = state.current;
    
    // Find the touch we're tracking
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
    
    // Check if our tracked touch ended
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

  // Scroll programmatically with smooth animation
  const scroll = useCallback((dir: "left" | "right", amount = 300) => {
    if (!scrollRef.current) return;
    
    cancelMomentum();
    
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, [cancelMomentum]);

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
