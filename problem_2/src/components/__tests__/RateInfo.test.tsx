import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { RateInfo } from '../RateInfo';
import { renderIntl } from '@/test/intlRender';
import { quote } from '@/lib/swap';
import type { Token } from '@/lib/tokens';

const eth: Token = { symbol: 'ETH', price: 2500, date: '', iconUrl: '' };
const usdc: Token = { symbol: 'USDC', price: 1, date: '', iconUrl: '' };

describe('RateInfo', () => {
  it('returns null when rate is zero', () => {
    const { container } = renderIntl(
      <RateInfo
        from={eth}
        to={usdc}
        quote={{ rate: 0, outputGross: 0, outputNet: 0, feeAmount: 0, minReceived: 0 }}
        slippagePct={0.5}
        feeBps={30}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the forward rate and fee/slippage/min rows', () => {
    const q = quote({ from: eth, to: usdc, amount: 1, feeBps: 30, slippagePct: 0.5 });
    renderIntl(
      <RateInfo from={eth} to={usdc} quote={q} slippagePct={0.5} feeBps={30} />,
    );
    expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument();
    expect(screen.getByText('Fee')).toBeInTheDocument();
    expect(screen.getByText(/0\.30%/)).toBeInTheDocument();
    expect(screen.getByText('Minimum received')).toBeInTheDocument();
  });

  it('inverts the rate display when the toggle is clicked', async () => {
    const q = quote({ from: eth, to: usdc, amount: 1, feeBps: 30, slippagePct: 0.5 });
    const user = userEvent.setup();
    renderIntl(
      <RateInfo from={eth} to={usdc} quote={q} slippagePct={0.5} feeBps={30} />,
    );
    await user.click(screen.getByRole('button', { name: /invert exchange rate/i }));
    expect(screen.getByText(/1 USDC = 0\.0004 ETH/i)).toBeInTheDocument();
  });
});
