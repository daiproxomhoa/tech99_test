import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { History } from '../History';
import { renderIntl } from '@/test/intlRender';
import type { HistoryEntry } from '@/lib/storage';

describe('History', () => {
  it('shows the empty state when there are no entries', () => {
    renderIntl(<History entries={[]} onClear={() => {}} />);
    expect(screen.getByText(/no swaps yet/i)).toBeInTheDocument();
  });

  it('lists entries with both tokens and a relative timestamp', () => {
    const entries: HistoryEntry[] = [
      {
        id: '1',
        fromSymbol: 'ETH',
        toSymbol: 'USDC',
        fromAmount: 1,
        toAmount: 2500,
        rate: 2500,
        timestamp: Date.now() - 5 * 60_000,
      },
    ];
    renderIntl(<History entries={entries} onClear={() => {}} />);
    const item = screen.getByRole('listitem');
    expect(item).toHaveTextContent('ETH');
    expect(item).toHaveTextContent('USDC');
    expect(item).toHaveTextContent('5m ago');
  });

  it('invokes onClear when the clear button is clicked', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    renderIntl(
      <History
        entries={[
          {
            id: 'x',
            fromSymbol: 'A',
            toSymbol: 'B',
            fromAmount: 1,
            toAmount: 1,
            rate: 1,
            timestamp: Date.now(),
          },
        ]}
        onClear={onClear}
      />,
    );
    await user.click(screen.getByRole('button', { name: /clear/i }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('shows "just now" for very recent entries', () => {
    const entries: HistoryEntry[] = [
      {
        id: '1',
        fromSymbol: 'A',
        toSymbol: 'B',
        fromAmount: 1,
        toAmount: 1,
        rate: 1,
        timestamp: Date.now(),
      },
    ];
    renderIntl(<History entries={entries} onClear={() => {}} />);
    expect(screen.getByText('just now')).toBeInTheDocument();
  });
});
