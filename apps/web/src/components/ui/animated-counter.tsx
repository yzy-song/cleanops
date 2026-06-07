"use client";

import { useEffect, useState } from "react";

interface Props {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function AnimatedCounter({ value, prefix = "", suffix = "", duration = 800, className }: Props) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === display) return;
    const start = performance.now();
    const from = display;
    const to = value;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(from + (to - from) * eased);
      setDisplay(current);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span className={className}>{prefix}{display.toLocaleString()}{suffix}</span>;
}
