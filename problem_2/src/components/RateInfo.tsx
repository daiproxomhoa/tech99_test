import { useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import { FormattedMessage, useIntl, type MessageDescriptor } from 'react-intl';
import type { Token } from '@/lib/tokens';
import type { Quote } from '@/lib/swap';
import { useFormatters } from '@/hooks/useFormatters';
import { m } from '@/i18n/messages';

interface Props {
  from: Token | null;
  to: Token | null;
  quote: Quote;
  slippagePct: number;
  feeBps: number;
}

export function RateInfo({ from, to, quote, slippagePct, feeBps }: Props) {
  const intl = useIntl();
  const { formatAmount, formatUsd } = useFormatters();
  const [inverted, setInverted] = useState(false);
  if (!from || !to || !quote.rate) return null;

  const rate = inverted ? 1 / quote.rate : quote.rate;
  const left = inverted ? to : from;
  const right = inverted ? from : to;

  const feeValue = intl.formatMessage(m.rateFeeValue, {
    pct: (feeBps / 100).toFixed(2),
    amount: formatAmount(quote.feeAmount),
    symbol: to.symbol,
  });

  return (
    <div className="space-y-1.5 rounded-2xl border border-border bg-surface-2/40 px-4 py-3 text-xs">
      <button
        type="button"
        onClick={() => setInverted((v) => !v)}
        className="flex w-full items-center justify-between text-fg hover:text-accent"
        aria-label={intl.formatMessage(m.rateInvert)}
      >
        <span className="inline-flex items-center gap-1 font-mono tabular-nums">
          1 {left.symbol} = {formatAmount(rate)} {right.symbol}
        </span>
        <ArrowLeftRight size={13} className="text-muted" />
      </button>

      <Row label={m.rateFee} value={feeValue} />
      <Row label={m.rateSlippage} value={`${slippagePct}%`} />
      <Row label={m.rateMinReceived} value={`${formatAmount(quote.minReceived)} ${to.symbol}`} />
      <Row label={m.rateOutputValue} value={formatUsd(quote.outputNet * to.price)} />
    </div>
  );
}

function Row({ label, value }: { label: MessageDescriptor; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">
        <FormattedMessage {...label} />
      </span>
      <span className="font-mono tabular-nums">{value}</span>
    </div>
  );
}
