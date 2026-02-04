import { useEffect, useState } from "react";

interface CountUpProps {
  end: number;
  duration?: number;
  formatter?: (value: number) => string;
  className?: string;
}

export const CountUp = ({
  end,
  duration = 500,
  formatter = (v) => v.toString(),
  className,
}: CountUpProps) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration]);

  return <span className={className}>{formatter(count)}</span>;
};
