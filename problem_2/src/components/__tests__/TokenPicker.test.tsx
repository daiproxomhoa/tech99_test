import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TokenPicker } from '../TokenPicker';
import { renderIntl } from '@/test/intlRender';
import type { Token } from '@/lib/tokens';

const tokens: Token[] = [
  { symbol: 'BTC', price: 50000, date: '', iconUrl: '' },
  { symbol: 'ETH', price: 2500, date: '', iconUrl: '' },
  { symbol: 'USDC', price: 1, date: '', iconUrl: '' },
];

describe('TokenPicker', () => {
  it('renders nothing when closed', () => {
    renderIntl(
      <TokenPicker open={false} onClose={() => {}} tokens={tokens} onSelect={() => {}} />,
    );
    expect(screen.queryByText('Select a token')).not.toBeInTheDocument();
  });

  it('lists every token except the excluded symbol', () => {
    renderIntl(
      <TokenPicker
        open
        onClose={() => {}}
        tokens={tokens}
        excludeSymbol="USDC"
        onSelect={() => {}}
      />,
    );
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.queryByText('USDC')).not.toBeInTheDocument();
  });

  it('filters the list by symbol search', async () => {
    const user = userEvent.setup();
    renderIntl(
      <TokenPicker open onClose={() => {}} tokens={tokens} onSelect={() => {}} />,
    );
    await user.type(screen.getByLabelText(/search tokens/i), 'eth');
    await waitFor(() => {
      expect(screen.queryByText('BTC')).not.toBeInTheDocument();
      expect(screen.getByText('ETH')).toBeInTheDocument();
    });
  });

  it('shows the empty state when nothing matches', async () => {
    const user = userEvent.setup();
    renderIntl(
      <TokenPicker open onClose={() => {}} tokens={tokens} onSelect={() => {}} />,
    );
    await user.type(screen.getByLabelText(/search tokens/i), 'zzz');
    expect(await screen.findByText(/no tokens match/i)).toBeInTheDocument();
  });

  it('calls onSelect + onClose when a row is clicked', async () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderIntl(
      <TokenPicker open onClose={onClose} tokens={tokens} onSelect={onSelect} />,
    );
    await user.click(screen.getByRole('button', { name: /BTC/ }));
    expect(onSelect).toHaveBeenCalledWith(
      expect.objectContaining({ symbol: 'BTC' }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });
});
