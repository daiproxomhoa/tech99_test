import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';

import { SwapCard } from '../SwapCard';
import { renderWithProviders } from '@/test/renderWithProviders';
import { server } from '@/test/server';
import { PRICES_URL } from '@/lib/tokens';
import { m } from '@/i18n/messages';
import viCompiled from '@/i18n/compiled-lang/vi.json';

/** Look the compiled (AST) translation up; fall back to source defaultMessage. */
function vi(descriptor: { id?: string; defaultMessage: string }): string {
  const catalog = viCompiled as Record<string, Array<{ type: number; value: string }>>;
  const id = descriptor.id;
  if (id && id in catalog) {
    return catalog[id].map((part) => part.value ?? '').join('');
  }
  return descriptor.defaultMessage;
}

beforeEach(() => window.localStorage.clear());
afterEach(() => window.localStorage.clear());

describe('SwapCard integration (en locale)', () => {
  it('loads tokens and shows the default ETH→USDC quote', async () => {
    renderWithProviders(<SwapCard />);

    await waitFor(() => {
      expect(screen.getAllByText('ETH').length).toBeGreaterThan(0);
      expect(screen.getAllByText('USDC').length).toBeGreaterThan(0);
    });

    const fromInput = screen.getByLabelText(m.inputYouPay.defaultMessage) as HTMLInputElement;
    expect(fromInput).toHaveValue('1');

    await waitFor(() => {
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument();
    });
  });

  it('shows the form-level error when amount is cleared and disables submit', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    await user.clear(fromInput);

    const submit = screen.getByRole('button', { name: m.validationEnterAmount.defaultMessage });
    expect(submit).toBeDisabled();
  });

  it('submits a mock swap, records it in history, and resets the amount', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    await screen.findByLabelText(m.inputYouPay.defaultMessage);
    const submitBtn = await screen.findByRole('button', {
      name: m.submitConfirm.defaultMessage,
    });
    await user.click(submitBtn);

    expect(
      screen.getByRole('button', { name: m.submitConfirming.defaultMessage }),
    ).toBeInTheDocument();

    await waitFor(
      () => {
        const list = screen.getByRole('list');
        const items = within(list).getAllByRole('listitem');
        expect(items.length).toBeGreaterThanOrEqual(1);
        expect(items[0]).toHaveTextContent(/ETH/);
        expect(items[0]).toHaveTextContent(/USDC/);
      },
      { timeout: 3000 },
    );

    const fromInput = screen.getByLabelText<HTMLInputElement>(m.inputYouPay.defaultMessage);
    expect(fromInput.value).toBe('');
  });

  it('flips from/to when the swap-direction button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    await screen.findByLabelText(m.inputYouPay.defaultMessage);
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );

    await user.click(
      screen.getByRole('button', { name: m.a11ySwapDirection.defaultMessage }),
    );

    await waitFor(() =>
      expect(screen.getByText(/1 USDC = 0\.0004 ETH/i)).toBeInTheDocument(),
    );
  });

  it('filters tokens in the picker and updates the From token', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    await screen.findByLabelText(m.inputYouPay.defaultMessage);
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );

    const chips = screen.getAllByRole('button', { name: /ETH|USDC/ });
    await user.click(chips[0]);

    const search = await screen.findByLabelText(m.pickerSearchLabel.defaultMessage);
    await user.type(search, 'BTC');

    const btcRow = await screen.findByRole('button', { name: /BTC/ });
    await user.click(btcRow);

    await waitFor(() =>
      expect(screen.getByText(/1 BTC = 50,?000 USDC/i)).toBeInTheDocument(),
    );
  });

  it('shows the error card and retry button when prices fetch fails', async () => {
    server.use(http.get(PRICES_URL, () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    const retry = await screen.findByRole(
      'button',
      { name: m.errorRetry.defaultMessage },
      { timeout: 5000 },
    );
    expect(retry).toBeInTheDocument();

    // Restore good handler, click retry → recover into a working swap UI
    server.use(
      http.get(PRICES_URL, () =>
        HttpResponse.json([
          { currency: 'ETH', date: '2024-01-02', price: 2500 },
          { currency: 'USDC', date: '2024-01-02', price: 1 },
        ]),
      ),
    );
    await user.click(retry);
    await screen.findByLabelText(m.inputYouPay.defaultMessage);
  });

  it('disables submit while a swap is in flight', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    const submitBtn = await screen.findByRole('button', {
      name: m.submitConfirm.defaultMessage,
    });
    await user.click(submitBtn);

    const confirming = await screen.findByRole('button', {
      name: m.submitConfirming.defaultMessage,
    });
    expect(confirming).toBeDisabled();
  });

  it('re-quotes when fee changes via Settings', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    await screen.findByLabelText(m.inputYouPay.defaultMessage);
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );

    // Capture initial "to" amount (with default 30 bps fee)
    const toInput = screen.getByLabelText<HTMLInputElement>(
      m.inputYouReceive.defaultMessage,
    );
    const initial = toInput.value;

    // Open settings, raise fee, click Done
    await user.click(
      screen.getByRole('button', { name: m.a11yOpenSettings.defaultMessage }),
    );
    const slider = await screen.findByLabelText(m.settingsFeeBpsLabel.defaultMessage);
    // bump fee to 100 bps
    fireEvent.change(slider, { target: { value: '100' } });

    await user.click(screen.getByRole('button', { name: /^done$/i }));

    await waitFor(() => {
      expect(toInput.value).not.toBe(initial);
    });
  });

  it('updates the from-input value while you type', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    await user.clear(fromInput);
    await user.type(fromInput, '2');
    await waitFor(() => {
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument();
    });
    // 2 ETH gross @ 2500 = 5000, fee 30 bps = 4985
    const toInput = screen.getByLabelText<HTMLInputElement>(
      m.inputYouReceive.defaultMessage,
    );
    await waitFor(() => {
      expect(toInput.value).toBe('4985');
    });
  });

  it('rejects amount=0 (Enter amount validation)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />);

    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    await user.clear(fromInput);
    await user.type(fromInput, '0');

    const submit = screen.getByRole('button', {
      name: m.validationPositive.defaultMessage,
    });
    expect(submit).toBeDisabled();
  });
});

describe('SwapCard integration (vi locale)', () => {
  it('renders Vietnamese labels and rejects clearing the amount', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SwapCard />, { locale: 'vi' });

    const fromInput = await screen.findByLabelText<HTMLInputElement>(vi(m.inputYouPay));
    expect(fromInput).toBeInTheDocument();

    await user.clear(fromInput);

    const submit = screen.getByRole('button', { name: vi(m.validationEnterAmount) });
    expect(submit).toBeDisabled();
  });
});
