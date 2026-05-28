import { memo, useState } from 'react';
import { cn } from '@/lib/cn';
import { tokenIconUrl } from '@/lib/tokens';

interface Props {
  symbol: string;
  size?: number;
  className?: string;
}

/**
 * Token icon with graceful fallback to a gradient initial when the SVG 404s.
 * Memoized — symbol+size is the only meaningful input.
 */
function TokenIconImpl({ symbol, size = 28, className }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-label={symbol}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
          className,
        )}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.42,
          background: `linear-gradient(135deg, hsl(${(symbol.charCodeAt(0) * 13) % 360} 80% 60%), hsl(${(symbol.charCodeAt(symbol.length - 1) * 19) % 360} 80% 50%))`,
        }}
      >
        {symbol[0]}
      </span>
    );
  }

  return (
    <img
      src={tokenIconUrl(symbol)}
      alt={`${symbol} icon`}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className={cn('shrink-0 rounded-full bg-surface-2', className)}
      style={{ width: size, height: size }}
    />
  );
}

export const TokenIcon = memo(TokenIconImpl);
