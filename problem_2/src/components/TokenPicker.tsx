import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';
import { Search, X } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Dialog } from './ui/Dialog';
import { TokenIcon } from './TokenIcon';
import { useFormatters } from '@/hooks/useFormatters';
import { m } from '@/i18n/messages';
import type { Token } from '@/lib/tokens';
import { cn } from '@/lib/cn';

interface Props {
  open: boolean;
  onClose: () => void;
  tokens: Token[];
  excludeSymbol?: string;
  onSelect: (token: Token) => void;
}

const ROW_HEIGHT = 64;

interface RowData {
  tokens: Token[];
  onSelect: (t: Token) => void;
  formatUsd: (v: number) => string;
  usdLabel: string;
}

const Row = memo(({ index, style, data }: ListChildComponentProps<RowData>) => {
  const token = data.tokens[index];
  return (
    <button
      style={style}
      onClick={() => data.onSelect(token)}
      className="group flex w-full items-center gap-3 px-4 hover:bg-surface-2 focus-visible:bg-surface-2"
    >
      <TokenIcon symbol={token.symbol} size={36} />
      <div className="flex flex-1 flex-col items-start text-left">
        <span className="text-sm font-semibold">{token.symbol}</span>
        <span className="text-xs text-muted">{data.usdLabel}</span>
      </div>
      <span className="font-mono text-sm tabular-nums">{data.formatUsd(token.price)}</span>
    </button>
  );
});
Row.displayName = 'Row';

export function TokenPicker({ open, onClose, tokens, excludeSymbol, onSelect }: Props) {
  const intl = useIntl();
  const { formatUsd } = useFormatters();
  const [query, setQuery] = useState('');
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const listWrapRef = useRef<HTMLDivElement>(null);
  const [listBoxHeight, setListBoxHeight] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listWrapRef.current;
    if (!el) return;
    const initial = el.getBoundingClientRect().height;
    if (initial > 0) setListBoxHeight(initial);
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height ?? 0;
      if (h > 0) setListBoxHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  const filtered = useMemo(() => {
    const q = deferred.trim().toUpperCase();
    return tokens.filter((t) => {
      if (t.symbol === excludeSymbol) return false;
      if (!q) return true;
      return t.symbol.includes(q);
    });
  }, [tokens, deferred, excludeSymbol]);

  const usdLabel = intl.formatMessage(m.pickerUsdPrice);

  const rowData = useMemo<RowData>(
    () => ({
      tokens: filtered,
      onSelect: (t) => {
        onSelect(t);
        onClose();
      },
      formatUsd,
      usdLabel,
    }),
    [filtered, onSelect, onClose, formatUsd, usdLabel],
  );

  return (
    <Dialog open={open} onClose={onClose} labelledBy="token-picker-title" className="sm:h-[600px]">
      <div className="flex items-center justify-between px-5 pt-5">
        <h2 id="token-picker-title" className="text-lg font-semibold">
          <FormattedMessage {...m.pickerTitle} />
        </h2>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label={intl.formatMessage(m.pickerClose)}
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-5 pt-3">
        <label className="relative block">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={intl.formatMessage(m.pickerSearch)}
            className="h-11 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-3 text-sm placeholder:text-muted focus:border-accent"
            aria-label={intl.formatMessage(m.pickerSearchLabel)}
          />
        </label>
      </div>

      <div ref={listWrapRef} className="mt-3 min-h-0 flex-1 border-t border-border">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-muted">
            <FormattedMessage {...m.pickerEmpty} />
          </div>
        ) : listBoxHeight > 0 ? (
          <FixedSizeList
            height={listBoxHeight}
            itemCount={filtered.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            itemData={rowData}
            itemKey={(i, data) => data.tokens[i].symbol}
            className={cn('scrollbar-thin')}
          >
            {Row}
          </FixedSizeList>
        ) : null}
      </div>
    </Dialog>
  );
}
