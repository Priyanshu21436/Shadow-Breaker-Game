import React, { useRef, useState, useEffect } from 'react';

interface JoystickProps {
  onStart: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}

export const Joystick: React.FC<JoystickProps> = ({ onStart, onMove, onEnd }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const initialTouch = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scroll
    const touch = e.changedTouches[0];
    initialTouch.current = { x: touch.clientX, y: touch.clientY };
    setIsActive(true);
    onStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isActive || !initialTouch.current) return;
    const touch = e.changedTouches[0];
    
    // Calculate visual offset limited to radius
    const maxRadius = 40;
    let dx = touch.clientX - initialTouch.current.x;
    let dy = touch.clientY - initialTouch.current.y;
    const distance = Math.sqrt(dx*dx + dy*dy);
    
    if (distance > maxRadius) {
      const ratio = maxRadius / distance;
      dx *= ratio;
      dy *= ratio;
    }

    setPosition({ x: dx, y: dy });
    onMove(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsActive(false);
    setPosition({ x: 0, y: 0 });
    initialTouch.current = null;
    onEnd();
  };

  return (
    <div 
      ref={containerRef}
      className="w-32 h-32 rounded-full border-2 border-white/20 bg-black/30 backdrop-blur-sm relative flex items-center justify-center touch-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div 
        className="w-12 h-12 rounded-full bg-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.8)] absolute pointer-events-none transition-transform duration-75"
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      />
    </div>
  );
};