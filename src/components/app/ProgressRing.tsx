import { cn } from "@/lib/utils";

export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  className,
  label,
  labelClassName,
  color,
  trackColor,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: React.ReactNode;
  labelClassName?: string;
  color?: string;
  trackColor?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const dash = (pct / 100) * c;

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`pg-${size}-${value}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="oklch(0.58 0.22 285)" />
            <stop offset="100%" stopColor="oklch(0.66 0.24 305)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke={trackColor} className={cn("fill-none", !trackColor && "stroke-muted")} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="fill-none"
          stroke={color || `url(#pg-${size}-${value})`}
        />
      </svg>
      <span className={cn("absolute text-[11px] font-bold text-foreground", labelClassName)}>{label ?? `${Math.round(pct)}%`}</span>
    </div>
  );
}
