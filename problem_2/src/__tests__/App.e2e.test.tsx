/**
 * End-to-end integration tests driving the real <App />: prices fetched via
 * MSW, full provider tree (Query + Locale + Intl), real Settings dialog,
 * real TokenPicker, real history persistence. These are slow but exercise
 * the surface a user actually touches.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import App from '../App';
import { LocaleProvider } from '../i18n/LocaleProvider';
import { server } from '../test/server';
import { PRICES_URL } from '../lib/tokens';
import { m } from '../i18n/messages';

function renderApp({ locale = 'en' }: { locale?: 'en' | 'vi' } = {}) {
  window.localStorage.setItem('swap:locale:v1', locale);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 0 } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <LocaleProvider>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </LocaleProvider>
    );
  }
  return render(<App />, { wrapper: Wrapper });
}

beforeEach(() => {
  window.localStorage.clear();
  document.body.style.overflow = '';
});
afterEach(() => {
  window.localStorage.clear();
});

describe('App E2E — full happy path', () => {
  it('loads prices, performs a complete ETH→BTC swap, persists to history', async () => {
    const user = userEvent.setup();
    renderApp();

    // 1. App boots and prices arrive
    await screen.findByRole('heading', { name: m.appTitle.defaultMessage });
    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    expect(fromInput).toHaveValue('1');
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );

    // 2. Open the "to" picker and switch USDC → BTC
    const chips = screen.getAllByRole('button', { name: /ETH|USDC/ });
    // chips[0] = from (ETH), chips[1] = to (USDC)
    await user.click(chips[1]);
    const search = await screen.findByLabelText(
      m.pickerSearchLabel.defaultMessage,
    );
    await user.type(search, 'BTC');
    const btcRow = await screen.findByRole('button', { name: /BTC/ });
    await user.click(btcRow);

    // 3. Rate re-quotes against BTC
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 0\.05 BTC/i)).toBeInTheDocument(),
    );

    // 4. Type a new amount
    await user.clear(fromInput);
    await user.type(fromInput, '4');
    const toInput = screen.getByLabelText<HTMLInputElement>(
      m.inputYouReceive.defaultMessage,
    );
    // 4 ETH * (2500/50000) * (1 - 30bps) = 0.2 * 0.997 = 0.1994
    await waitFor(() => expect(toInput.value).toBe('0.1994'));

    // 5. Submit and wait for success
    const submit = screen.getByRole('button', {
      name: m.submitConfirm.defaultMessage,
    });
    await user.click(submit);
    await screen.findByRole('button', {
      name: m.submitConfirming.defaultMessage,
    });

    // 6. History gets the entry — pick the history list (toast renders its own)
    await waitFor(
      () => {
        const lists = screen.getAllByRole('list');
        const history = lists.find((l) =>
          within(l)
            .queryAllByRole('listitem')
            .some((li) => /BTC/.test(li.textContent ?? '')),
        );
        expect(history).toBeDefined();
        const items = within(history!).getAllByRole('listitem');
        expect(items[0]).toHaveTextContent(/ETH/);
        expect(items[0]).toHaveTextContent(/BTC/);
      },
      { timeout: 3000 },
    );

    // 7. Amount field reset for next swap
    expect(fromInput.value).toBe('');

    // 8. History persists in localStorage
    const stored = window.localStorage.getItem('swap:history:v1');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!)[0]).toMatchObject({
      fromSymbol: 'ETH',
      toSymbol: 'BTC',
    });
  });
});

describe('App E2E — settings flow', () => {
  it('changing fee in Settings affects the next quote (apply only on Done)', async () => {
    const user = userEvent.setup();
    renderApp();

    await screen.findByLabelText(m.inputYouPay.defaultMessage);
    const toInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouReceive.defaultMessage,
    );
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );
    const initial = toInput.value;

    // Open Settings, raise fee to max (100 bps = 1%)
    await user.click(
      screen.getByRole('button', { name: m.a11yOpenSettings.defaultMessage }),
    );
    const slider = await screen.findByLabelText(
      m.settingsFeeBpsLabel.defaultMessage,
    );
    fireEvent.change(slider, { target: { value: '100' } });

    // Before Done — quote unchanged outside the dialog (dialog uses its own draft)
    // Click Done to apply
    await user.click(screen.getByRole('button', { name: /^done$/i }));

    await waitFor(() => {
      expect(toInput.value).not.toBe(initial);
    });

    // Settings persisted
    const stored = JSON.parse(
      window.localStorage.getItem('swap:settings:v1') ?? 'null',
    );
    expect(stored).toMatchObject({ feeBps: 100 });
  });

  it('closing Settings via X discards draft and leaves quote unchanged', async () => {
    const user = userEvent.setup();
    renderApp();

    const toInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouReceive.defaultMessage,
    );
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );
    const before = toInput.value;

    await user.click(
      screen.getByRole('button', { name: m.a11yOpenSettings.defaultMessage }),
    );
    const slider = await screen.findByLabelText(
      m.settingsFeeBpsLabel.defaultMessage,
    );
    fireEvent.change(slider, { target: { value: '100' } });

    // Close without Done — find the X by aria-label
    const closeButtons = screen.getAllByRole('button', { name: /close/i });
    await user.click(closeButtons[0]);

    expect(toInput.value).toBe(before);
    // Settings were never committed → stored feeBps stays at the default
    const stored = JSON.parse(
      window.localStorage.getItem('swap:settings:v1') ?? 'null',
    );
    expect(stored?.feeBps).toBe(30);
  });
});

describe('App E2E — error + recovery', () => {
  it('shows the error card when prices fetch fails, then recovers via retry', async () => {
    server.use(http.get(PRICES_URL, () => new HttpResponse(null, { status: 500 })));
    const user = userEvent.setup();
    renderApp();

    const retry = await screen.findByRole(
      'button',
      { name: m.errorRetry.defaultMessage },
      { timeout: 4000 },
    );

    // Restore good data, retry → swap UI returns
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
    await waitFor(() =>
      expect(screen.getByText(/1 ETH = 2,?500 USDC/i)).toBeInTheDocument(),
    );
  });
});

describe('App E2E — flip + validation', () => {
  it('flip button reverses the pair and re-quotes', async () => {
    const user = userEvent.setup();
    renderApp();

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

  it('empty amount disables submit with the right validation label', async () => {
    const user = userEvent.setup();
    renderApp();

    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    await user.clear(fromInput);
    const submit = screen.getByRole('button', {
      name: m.validationEnterAmount.defaultMessage,
    });
    expect(submit).toBeDisabled();
  });

  it('amount=0 surfaces the positive-amount validation', async () => {
    const user = userEvent.setup();
    renderApp();

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

  it('non-decimal characters are stripped by sanitizeAmountInput', async () => {
    const user = userEvent.setup();
    renderApp();

    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    await user.clear(fromInput);
    await user.type(fromInput, 'abc12.5xx');
    expect(fromInput.value).toBe('12.5');
  });
});

describe('App E2E — history operations', () => {
  it('Clear History wipes the list and localStorage', async () => {
    const user = userEvent.setup();
    // Pre-seed history
    window.localStorage.setItem(
      'swap:history:v1',
      JSON.stringify([
        {
          id: 'seed-1',
          fromSymbol: 'ETH',
          toSymbol: 'USDC',
          fromAmount: 1,
          toAmount: 2500,
          rate: 2500,
          timestamp: Date.now(),
        },
      ]),
    );
    renderApp();

    await screen.findByLabelText(m.inputYouPay.defaultMessage);
    expect(
      screen.getByRole('button', { name: m.historyClear.defaultMessage }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: m.historyClear.defaultMessage }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(m.historyEmpty.defaultMessage),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: m.historyClear.defaultMessage }),
      ).not.toBeInTheDocument();
    });

    expect(
      JSON.parse(window.localStorage.getItem('swap:history:v1') ?? '[]'),
    ).toEqual([]);
  });

  it('multiple swaps stack newest-first in history', { timeout: 10_000 }, async () => {
    const user = userEvent.setup();
    renderApp();

    const fromInput = await screen.findByLabelText<HTMLInputElement>(
      m.inputYouPay.defaultMessage,
    );
    await screen.findByRole('button', { name: m.submitConfirm.defaultMessage });

    // Swap #1: 1 ETH → USDC
    await user.click(
      screen.getByRole('button', { name: m.submitConfirm.defaultMessage }),
    );
    await waitFor(
      () => {
        // Sonner's Toaster also renders a <ol role="list">. Pick the history
        // list — the one whose items contain the token symbols.
        const lists = screen.getAllByRole('list');
        const history = lists.find((l) =>
          within(l)
            .queryAllByRole('listitem')
            .some((li) => /ETH/.test(li.textContent ?? '')),
        );
        expect(history).toBeDefined();
        expect(within(history!).getAllByRole('listitem')).toHaveLength(1);
      },
      { timeout: 3000 },
    );

    // Wait for the post-success reset (1.5s timer) — amount field cleared
    // makes the button label flip back to "Enter amount". Type the next
    // amount first, then look for the confirm button to come back.
    await waitFor(() => expect(fromInput.value).toBe(''), { timeout: 3000 });
    await user.type(fromInput, '3');
    const confirmBtn = await screen.findByRole(
      'button',
      { name: m.submitConfirm.defaultMessage },
      { timeout: 3000 },
    );
    await user.click(confirmBtn);

    await waitFor(
      () => {
        const lists = screen.getAllByRole('list');
        const history = lists.find((l) =>
          within(l)
            .queryAllByRole('listitem')
            .some((li) => /ETH/.test(li.textContent ?? '')),
        );
        expect(history).toBeDefined();
        const items = within(history!).getAllByRole('listitem');
        expect(items).toHaveLength(2);
        expect(items[0]).toHaveTextContent(/3\s*ETH/);
      },
      { timeout: 3000 },
    );
  });
});

describe('App E2E — locale', () => {
  it('renders Vietnamese labels when locale=vi', async () => {
    renderApp({ locale: 'vi' });
    // Vietnamese label "Bạn trả" for inputYouPay
    await screen.findByLabelText(/bạn trả/i);
  });

  it('switches locale at runtime via LanguageToggle', async () => {
    const user = userEvent.setup();
    renderApp();

    // Open Settings (mobile-only toggles live there, but desktop header has them too)
    // The header is hidden on small screens, but jsdom has no viewport — both render.
    await screen.findByLabelText(m.inputYouPay.defaultMessage);

    // Find the VI button — language toggle group
    const viButtons = screen.getAllByRole('button', { name: /^vi$/i });
    await user.click(viButtons[0]);

    await waitFor(() => {
      expect(screen.queryByLabelText(m.inputYouPay.defaultMessage)).toBeNull();
      expect(screen.getByLabelText(/bạn trả/i)).toBeInTheDocument();
    });

    // Persisted
    expect(window.localStorage.getItem('swap:locale:v1')).toBe('vi');
  });
});
