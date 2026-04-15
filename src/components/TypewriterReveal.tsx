import { useState, useEffect } from "react";

interface TypewriterRevealProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
}

const TypewriterReveal = ({ text, speed = 15, onComplete, className = "" }: TypewriterRevealProps) => {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <span className={className}>
      {displayed}
      {!done && (
        <span className="inline-block w-0.5 h-[1em] bg-primary align-middle ml-0.5 animate-pulse" />
      )}
    </span>
  );
};

export default TypewriterReveal;
