import { useRef, useState, useCallback, useEffect } from "react";

interface UseDragScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
  direction?: "horizontal" | "vertical" | "both";
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { sensitivity = 1.5, momentum = true, direction = "horizontal" } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const scrollLeft = useRef(0);
  const scrollTop = useRef(0);
  const velocity = useRef({ x: 0, y: 0 });
  const lastPosition = useRef({ x: 0, y: 0 });
  const lastTime = useRef(0);
  const animationRef = useRef<number>();
  const dragThreshold = 5;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    
    // Prevent default to stop text selection
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setHasDragged(false);
    
    startX.current = e.clientX;
    startY.current = e.clientY;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollTop.current = scrollRef.current.scrollTop;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    lastTime.current = performance.now();
    velocity.current = { x: 0, y: 0 };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Add grabbing cursor to body
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = (startX.current - e.clientX) * sensitivity;
    const deltaY = (startY.current - e.clientY) * sensitivity;
    
    // Check if movement exceeds drag threshold
    if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
      setHasDragged(true);
    }
    
    if (direction === "horizontal" || direction === "both") {
      scrollRef.current.scrollLeft = scrollLeft.current + deltaX;
    }
    if (direction === "vertical" || direction === "both") {
      scrollRef.current.scrollTop = scrollTop.current + deltaY;
    }

    // Calculate velocity for momentum
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = {
        x: (e.clientX - lastPosition.current.x) / dt * 20,
        y: (e.clientY - lastPosition.current.y) / dt * 20,
      };
    }
    lastPosition.current = { x: e.clientX, y: e.clientY };
    lastTime.current = now;
  }, [isDragging, sensitivity, direction]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Apply momentum scrolling
    if (momentum && scrollRef.current) {
      let currentVelocity = { ...velocity.current };
      
      const animate = () => {
        if (!scrollRef.current) return;
        
        const absX = Math.abs(currentVelocity.x);
        const absY = Math.abs(currentVelocity.y);
        
        if (absX < 0.5 && absY < 0.5) return;
        
        if (direction === "horizontal" || direction === "both") {
          scrollRef.current.scrollLeft -= currentVelocity.x;
        }
        if (direction === "vertical" || direction === "both") {
          scrollRef.current.scrollTop -= currentVelocity.y;
        }
        
        // Apply friction
        currentVelocity.x *= 0.92;
        currentVelocity.y *= 0.92;
        
        animationRef.current = requestAnimationFrame(animate);
      };
      
      if (Math.abs(currentVelocity.x) > 1 || Math.abs(currentVelocity.y) > 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }
    
    // Reset hasDragged after a short delay to allow click events
    setTimeout(() => setHasDragged(false), 100);
  }, [isDragging, momentum, direction]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp();
    }
  }, [isDragging, handleMouseUp]);

  // Touch events with improved handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    
    const touch = e.touches[0];
    setIsDragging(true);
    setHasDragged(false);
    
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    scrollLeft.current = scrollRef.current.scrollLeft;
    scrollTop.current = scrollRef.current.scrollTop;
    lastPosition.current = { x: touch.clientX, y: touch.clientY };
    lastTime.current = performance.now();
    velocity.current = { x: 0, y: 0 };
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = (startX.current - touch.clientX) * sensitivity;
    const deltaY = (startY.current - touch.clientY) * sensitivity;
    
    if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
      setHasDragged(true);
    }
    
    if (direction === "horizontal" || direction === "both") {
      scrollRef.current.scrollLeft = scrollLeft.current + deltaX;
    }
    if (direction === "vertical" || direction === "both") {
      scrollRef.current.scrollTop = scrollTop.current + deltaY;
    }

    // Calculate velocity
    const now = performance.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      velocity.current = {
        x: (touch.clientX - lastPosition.current.x) / dt * 20,
        y: (touch.clientY - lastPosition.current.y) / dt * 20,
      };
    }
    lastPosition.current = { x: touch.clientX, y: touch.clientY };
    lastTime.current = now;
  }, [isDragging, sensitivity, direction]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Global mouse events for better drag handling
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      
      e.preventDefault();
      
      const deltaX = (startX.current - e.clientX) * sensitivity;
      const deltaY = (startY.current - e.clientY) * sensitivity;
      
      if (Math.abs(deltaX) > dragThreshold || Math.abs(deltaY) > dragThreshold) {
        setHasDragged(true);
      }
      
      if (direction === "horizontal" || direction === "both") {
        scrollRef.current.scrollLeft = scrollLeft.current + deltaX;
      }
      if (direction === "vertical" || direction === "both") {
        scrollRef.current.scrollTop = scrollTop.current + deltaY;
      }

      const now = performance.now();
      const dt = now - lastTime.current;
      if (dt > 0) {
        velocity.current = {
          x: (e.clientX - lastPosition.current.x) / dt * 20,
          y: (e.clientY - lastPosition.current.y) / dt * 20,
        };
      }
      lastPosition.current = { x: e.clientX, y: e.clientY };
      lastTime.current = now;
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, handleMouseUp, sensitivity, direction]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // Scroll methods
  const scroll = useCallback((dir: "left" | "right", amount = 320) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: dir === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  }, []);

  return {
    scrollRef,
    isDragging: hasDragged,
    handlers: {
      onMouseDown: handleMouseDown,
      onMouseMove: handleMouseMove,
      onMouseUp: handleMouseUp,
      onMouseLeave: handleMouseLeave,
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    scroll,
  };
};
