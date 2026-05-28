import { memo, useId, useMemo } from 'react';
import { buildPath, mockSeries } from '@/lib/sparkline';
import { cn } from '@/lib/cn';

interface Props {
  symbol: string;
  price: number;
  width?: number;
  height?: number;
  className?: string;
}

function SparklineImpl({ symbol, price, width = 96, height = 28, className }: Props) {
  const gradId = useId();
  const { points, trendUp } = useMemo(() => {
    const series = mockSeries(symbol, price);
    const pts = buildPath(series, width, height);
    const up = series[series.length - 1] >= series[0];
    return { points: pts, trendUp: up };
  }, [symbol, price, width, height]);

  const color = trendUp ? 'hsl(var(--success))' : 'hsl(var(--danger))';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={`${symbol} 7-day trend`}
    >
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={`${points} ${width - 2},${height - 2} 2,${height - 2}`}
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}

export const Sparkline = memo(SparklineImpl);
