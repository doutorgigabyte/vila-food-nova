import { useRef, useState, useCallback, useEffect } from "react";

interface UseDragScrollOptions {
  sensitivity?: number;
  momentum?: boolean;
}

export const useDragScroll = (options: UseDragScrollOptions = {}) => {
  const { sensitivity = 1, momentum = true } = options;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const lastX = useRef(0);
  const lastTime = useRef(0);
  const animationRef = useRef<number>();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    lastX.current = e.pageX;
    lastTime.current = Date.now();
    setVelocity(0);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * sensitivity;
    scrollRef.current.scrollLeft = scrollLeft - walk;

    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      const dx = e.pageX - lastX.current;
      setVelocity(dx / dt * 15);
    }
    lastX.current = e.pageX;
    lastTime.current = now;
  }, [isDragging, startX, scrollLeft, sensitivity]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Apply momentum scrolling
    if (momentum && scrollRef.current && Math.abs(velocity) > 0.5) {
      let currentVelocity = velocity;
      
      const animate = () => {
        if (!scrollRef.current || Math.abs(currentVelocity) < 0.5) return;
        
        scrollRef.current.scrollLeft -= currentVelocity;
        currentVelocity *= 0.95; // Friction
        animationRef.current = requestAnimationFrame(animate);
      };
      
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [isDragging, velocity, momentum]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      handleMouseUp();
    }
  }, [isDragging, handleMouseUp]);

  // Touch events
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!scrollRef.current) return;
    
    setIsDragging(true);
    setStartX(e.touches[0].pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    lastX.current = e.touches[0].pageX;
    lastTime.current = Date.now();
    setVelocity(0);
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * sensitivity;
    scrollRef.current.scrollLeft = scrollLeft - walk;

    // Calculate velocity for momentum
    const now = Date.now();
    const dt = now - lastTime.current;
    if (dt > 0) {
      const dx = e.touches[0].pageX - lastX.current;
      setVelocity(dx / dt * 15);
    }
    lastX.current = e.touches[0].pageX;
    lastTime.current = now;
  }, [isDragging, startX, scrollLeft, sensitivity]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Scroll methods
  const scroll = useCallback((direction: "left" | "right", amount = 320) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  }, []);

  return {
    scrollRef,
    isDragging,
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
