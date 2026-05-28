import { ArrowRight, Clock, Trash2 } from 'lucide-react';
import { FormattedMessage, useIntl } from 'react-intl';
import type { HistoryEntry } from '@/lib/storage';
import { useFormatters } from '@/hooks/useFormatters';
import { m } from '@/i18n/messages';
import { TokenIcon } from './TokenIcon';

interface Props {
  entries: HistoryEntry[];
  onClear: () => void;
}

function useTimeAgo() {
  const intl = useIntl();
  return (ts: number): string => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 1) return intl.formatMessage(m.historyJustNow);
    if (minutes < 60) return intl.formatMessage(m.historyMinutesAgo, { n: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return intl.formatMessage(m.historyHoursAgo, { n: hours });
    return intl.formatMessage(m.historyDaysAgo, { n: Math.floor(hours / 24) });
  };
}

export function History({ entries, onClear }: Props) {
  const { formatAmount } = useFormatters();
  const timeAgo = useTimeAgo();

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted">
        <Clock size={20} className="mx-auto mb-2 opacity-60" />
        <FormattedMessage {...m.historyEmpty} />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold">
          <FormattedMessage {...m.historyTitle} />
        </h3>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted hover:bg-surface-2 hover:text-danger"
        >
          <Trash2 size={12} /> <FormattedMessage {...m.historyClear} />
        </button>
      </div>
      <ul className="space-y-1.5">
        {entries.map((e) => (
          <li
            key={e.id}
            className="flex items-center gap-2.5 rounded-xl border border-border bg-surface px-2.5 py-2.5 text-sm sm:gap-3 sm:px-3"
          >
            <div className="flex shrink-0 items-center -space-x-2">
              <TokenIcon symbol={e.fromSymbol} size={22} />
              <TokenIcon symbol={e.toSymbol} size={22} />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 font-mono text-xs tabular-nums sm:gap-2 sm:text-sm">
              <span className="truncate">
                {formatAmount(e.fromAmount)} {e.fromSymbol}
              </span>
              <ArrowRight size={12} className="shrink-0 text-muted" />
              <span className="truncate">
                {formatAmount(e.toAmount)} {e.toSymbol}
              </span>
            </div>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-muted sm:text-xs">
              {timeAgo(e.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
