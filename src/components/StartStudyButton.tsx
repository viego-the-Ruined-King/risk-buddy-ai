import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";

interface StartStudyButtonProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
  type?: "button" | "submit";
}

const StartStudyButton = ({
  onClick,
  loading = false,
  disabled = false,
  label = "GET STARTED",
  type = "button",
}: StartStudyButtonProps) => {
  const [isChecked, setIsChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (disabled || loading) return;
    setIsChecked((prev) => !prev);
    onClick();
  };

  const chars = label.split("");

  return (
    <div className="flex justify-center w-full">
      <label className="ssb-area" onClick={(e) => e.preventDefault()}>
        <input
          ref={inputRef}
          type="checkbox"
          checked={isChecked}
          onChange={handleClick}
          disabled={disabled || loading}
          className="opacity-0 w-0 h-0 absolute"
        />
        <div className={`ssb-button ${disabled ? "opacity-50 pointer-events-none" : ""}`}>
          <div className="ssb-wrap" />
          <div className="ssb-reflex" />

          <div className="ssb-content">
            {loading ? (
              <div className="flex items-center gap-2 text-[#3c5d7d]">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm font-semibold">Processing...</span>
              </div>
            ) : (
              <>
                <div className="ssb-text ssb-state-1">
                  {chars.map((char, i) => (
                    <span
                      key={`s1-${i}`}
                      data-label={char === " " ? "\u00A0" : char}
                      style={{ "--i": i + 1 } as React.CSSProperties}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                </div>
                <div className="ssb-text ssb-state-2">
                  {chars.map((_, i) => (
                    <span
                      key={`s2-${i}`}
                      data-label="⎯"
                      style={{ "--i": i + 1 } as React.CSSProperties}
                    >
                      ⎯
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Gears SVG */}
          <div className="ssb-gears">
            <svg viewBox="0 0 132 82" xmlns="http://www.w3.org/2000/svg">
              <g>
                <path className="ssb-gear-small ssb-shadow" d="M77.5 30.5a10 10 0 1 0-5 17.3l2-3.5a6 6 0 1 1 3-10.4l2-3.4Z" />
                <path className="ssb-gear-medium ssb-shadow" d="M95 25a14 14 0 1 0-7 24.2l2-3.5a10 10 0 1 1 5-17.3l2-3.4Z" />
                <path className="ssb-gear-large ssb-shadow" d="M115 20a18 18 0 1 0-9 31.2l2-3.5a14 14 0 1 1 7-24.2l2-3.5Z" />
              </g>
              <g>
                <path className="ssb-gear-small" d="M77.5 30.5a10 10 0 1 0-5 17.3l2-3.5a6 6 0 1 1 3-10.4l2-3.4Z" />
                <path className="ssb-gear-medium" d="M95 25a14 14 0 1 0-7 24.2l2-3.5a10 10 0 1 1 5-17.3l2-3.4Z" />
                <path className="ssb-gear-large" d="M115 20a18 18 0 1 0-9 31.2l2-3.5a14 14 0 1 1 7-24.2l2-3.5Z" />
              </g>
            </svg>
          </div>

          {/* Wave effect */}
          <div className="ssb-wave" />

          {/* Sparks */}
          <svg className="ssb-sparks" viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg">
            {[...Array(8)].map((_, i) => (
              <path
                key={i}
                d={`M${15 * i + 5},${30 + (i % 2 ? -10 : 10)} Q${15 * i + 12},${i % 2 ? 5 : 55} ${15 * i + 20},30`}
                fill="none"
                style={{ "--i": (i + 1) * 0.15 } as React.CSSProperties}
              />
            ))}
          </svg>

          {/* Path SVG below button */}
          <svg className="ssb-path" viewBox="0 0 200 20" xmlns="http://www.w3.org/2000/svg">
            {[...Array(12)].map((_, i) => (
              <line
                key={i}
                x1={5 + i * 16}
                y1={10 + (i % 2 ? -3 : 3)}
                x2={15 + i * 16}
                y2={10 + (i % 2 ? 3 : -3)}
                stroke="currentColor"
              />
            ))}
          </svg>
        </div>
      </label>
    </div>
  );
};

export default StartStudyButton;
