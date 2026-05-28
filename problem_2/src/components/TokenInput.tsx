import { ChevronDown } from 'lucide-react';
import { memo } from 'react';
import { FormattedMessage, useIntl, type MessageDescriptor } from 'react-intl';
import { TokenIcon } from './TokenIcon';
import { sanitizeAmountInput } from '@/lib/format';
import { useFormatters } from '@/hooks/useFormatters';
import { m } from '@/i18n/messages';
import type { Token } from '@/lib/tokens';
import { cn } from '@/lib/cn';

interface Props {
  label: MessageDescriptor;
  token: Token | null;
  amount: string;
  onAmountChange?: (next: string) => void;
  onPickToken: () => void;
  readOnly?: boolean;
  usdValue?: number;
  /** Optional validation error to surface — a MessageDescriptor from `m`. */
  error?: MessageDescriptor;
  loading?: boolean;
  inputId?: string;
}

function TokenInputImpl({
  label,
  token,
  amount,
  onAmountChange,
  onPickToken,
  readOnly,
  usdValue,
  error,
  loading,
  inputId,
}: Props) {
  const intl = useIntl();
  const { formatUsd } = useFormatters();
  return (
    <div
      className={cn(
        'group rounded-2xl border bg-surface-2/60 p-3 transition-colors sm:p-4',
        error
          ? 'border-danger/60'
          : 'border-transparent hover:border-border focus-within:border-accent/60',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted">
        <label htmlFor={inputId} className="shrink-0">
          <FormattedMessage {...label} />
        </label>
        {token && (
          <span className="truncate font-mono tabular-nums">
            <FormattedMessage
              {...m.inputPriceOf}
              values={{ symbol: token.symbol, price: formatUsd(token.price) }}
            />
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <input
          id={inputId}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0.00"
          value={amount}
          readOnly={readOnly}
          onChange={(e) => onAmountChange?.(sanitizeAmountInput(e.target.value))}
          className={cn(
            'min-w-0 flex-1 bg-transparent font-mono text-2xl font-semibold tabular-nums outline-none placeholder:text-muted/60 sm:text-3xl',
            readOnly && 'cursor-default',
          )}
          aria-invalid={!!error}
        />

        <button
          type="button"
          onClick={onPickToken}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm font-semibold transition-colors',
            'hover:bg-surface-2 hover:border-accent/40',
          )}
        >
          {token ? (
            <>
              <TokenIcon symbol={token.symbol} size={22} />
              <span>{token.symbol}</span>
            </>
          ) : (
            <span className="text-muted">
              <FormattedMessage {...m.inputSelectToken} />
            </span>
          )}
          <ChevronDown size={16} className="text-muted" />
        </button>
      </div>

      <div className="mt-2 flex h-4 items-center justify-between text-xs">
        <span className="text-muted">
          {loading ? '...' : usdValue ? `≈ ${formatUsd(usdValue)}` : ' '}
        </span>
        {error && (
          <span role="alert" className="text-danger">
            {intl.formatMessage(error)}
          </span>
        )}
      </div>
    </div>
  );
}

export const TokenInput = memo(TokenInputImpl);
