import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TokenInput } from '../TokenInput';
import { renderIntl } from '@/test/intlRender';
import { m } from '@/i18n/messages';
import type { Token } from '@/lib/tokens';

const eth: Token = { symbol: 'ETH', price: 2500, date: '', iconUrl: '' };

describe('TokenInput', () => {
  it('shows the token symbol on the chip and the inline price', () => {
    renderIntl(
      <TokenInput
        inputId="amt"
        label={m.inputYouPay}
        token={eth}
        amount=""
        onAmountChange={() => {}}
        onPickToken={() => {}}
      />,
    );
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText(/1 ETH = \$2,500\.00/)).toBeInTheDocument();
  });

  it('sanitizes user input via the change handler', () => {
    const onChange = vi.fn();
    renderIntl(
      <TokenInput
        inputId="amt"
        label={m.inputYouPay}
        token={eth}
        amount=""
        onAmountChange={onChange}
        onPickToken={() => {}}
      />,
    );
    const input = screen.getByLabelText(m.inputYouPay.defaultMessage);
    // fireEvent.change goes through React's synthetic event system,
    // which is required for controlled inputs to dispatch onChange.
    fireEvent.change(input, { target: { value: '1a.2.3' } });
    expect(onChange).toHaveBeenLastCalledWith('1.23');
  });

  it('renders error as alert and marks input aria-invalid', () => {
    renderIntl(
      <TokenInput
        inputId="amt"
        label={m.inputYouPay}
        token={eth}
        amount=""
        onAmountChange={() => {}}
        onPickToken={() => {}}
        error={m.validationEnterAmount}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      m.validationEnterAmount.defaultMessage,
    );
    expect(screen.getByLabelText(m.inputYouPay.defaultMessage)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('fires onPickToken when the chip is clicked', async () => {
    const onPick = vi.fn();
    const user = userEvent.setup();
    renderIntl(
      <TokenInput
        inputId="amt"
        label={m.inputYouPay}
        token={eth}
        amount=""
        onAmountChange={() => {}}
        onPickToken={onPick}
      />,
    );
    await user.click(screen.getByRole('button', { name: /ETH/ }));
    expect(onPick).toHaveBeenCalledOnce();
  });

  it('shows the "Select" placeholder when no token is set', () => {
    renderIntl(
      <TokenInput
        inputId="amt"
        label={m.inputYouPay}
        token={null}
        amount=""
        onAmountChange={() => {}}
        onPickToken={() => {}}
      />,
    );
    expect(screen.getByText(m.inputSelectToken.defaultMessage)).toBeInTheDocument();
  });
});
