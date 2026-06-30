'use client';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (next: { min: number; max: number }) => void;
}

// Dual-thumb price slider (Stitch "Collection with Price Slider"). Two native
// range inputs stacked over a visual track keep it fully keyboard-accessible;
// .oren-range (globals.css) hides the native tracks and styles the thumbs, and
// `pointer-events` is disabled on the inputs but re-enabled on the thumbs so
// both handles stay grabbable. Controlled: it reports clamped values up and
// renders from props — the parent owns the draft state.
export default function PriceRangeSlider({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChange,
}: PriceRangeSliderProps) {
  const span = max - min || 1;
  const minPercent = ((valueMin - min) / span) * 100;
  const maxPercent = ((valueMax - min) / span) * 100;

  const handleMin = (raw: number) => {
    // Never let the lower thumb pass the upper one.
    onChange({ min: Math.min(raw, valueMax), max: valueMax });
  };
  const handleMax = (raw: number) => {
    onChange({ min: valueMin, max: Math.max(raw, valueMin) });
  };

  return (
    <div className="relative h-6 w-full">
      {/* Inactive track */}
      <div className="absolute top-1/2 h-1 w-full -translate-y-1/2 rounded-full bg-hairline/40" />
      {/* Selected range */}
      <div
        className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brown"
        style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
      />
      <input
        type="range"
        aria-label="Minimum price"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(e) => handleMin(Number(e.target.value))}
        // Raise the lower thumb above the upper one once it nears the top end,
        // otherwise the stacked upper input would swallow the grab.
        className="oren-range"
        style={{ zIndex: valueMin > max - (max - min) / 10 ? 5 : 3 }}
      />
      <input
        type="range"
        aria-label="Maximum price"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(e) => handleMax(Number(e.target.value))}
        className="oren-range"
        style={{ zIndex: 4 }}
      />
    </div>
  );
}
