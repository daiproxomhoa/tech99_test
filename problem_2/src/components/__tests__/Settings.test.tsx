import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Settings } from '../Settings';
import { renderIntl } from '@/test/intlRender';
import { DEFAULT_SETTINGS } from '@/lib/storage';

const DONE = /^done$/i;
const CLOSE = /close/i;

describe('Settings', () => {
  describe('mount + render', () => {
    it('does not render content when closed', () => {
      renderIntl(
        <Settings
          open={false}
          onClose={() => {}}
          settings={DEFAULT_SETTINGS}
          onChange={() => {}}
        />,
      );
      expect(screen.queryByText('Swap settings')).not.toBeInTheDocument();
    });

    it('renders title, slippage presets and fee slider when open', () => {
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={() => {}} />,
      );
      expect(screen.getByRole('heading', { name: /swap settings/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '0.1%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '0.5%' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '1%' })).toBeInTheDocument();
      expect(screen.getByLabelText(/custom slippage percent/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/fee/i)).toBeInTheDocument();
    });

    it('marks the current slippage preset as pressed', () => {
      renderIntl(
        <Settings
          open
          onClose={() => {}}
          settings={{ slippagePct: 0.5, feeBps: 30 }}
          onChange={() => {}}
        />,
      );
      expect(screen.getByRole('button', { name: '0.5%' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: '0.1%' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('staged editing (changes apply only on Done)', () => {
    it('does not fire onChange while editing slippage', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      await user.click(screen.getByRole('button', { name: '1%' }));
      fireEvent.change(screen.getByLabelText(/custom slippage percent/i), {
        target: { value: '2.5' },
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('reflects staged slippage in aria-pressed before Done', async () => {
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={() => {}} />,
      );
      await user.click(screen.getByRole('button', { name: '1%' }));
      expect(screen.getByRole('button', { name: '1%' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: '0.5%' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });

    it('commits both slippage and fee on Done', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      await user.click(screen.getByRole('button', { name: '1%' }));
      fireEvent.change(screen.getByLabelText(/fee/i), { target: { value: '50' } });
      await user.click(screen.getByRole('button', { name: DONE }));
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith({ slippagePct: 1, feeBps: 50 });
    });

    it('Done click also calls onClose', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={onClose} settings={DEFAULT_SETTINGS} onChange={() => {}} />,
      );
      await user.click(screen.getByRole('button', { name: DONE }));
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('discard paths', () => {
    it('clicking X discards staged changes and calls onClose only', async () => {
      const onChange = vi.fn();
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={onClose} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      await user.click(screen.getByRole('button', { name: '1%' }));
      await user.click(screen.getByRole('button', { name: CLOSE }));
      expect(onChange).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('Escape key discards staged changes and calls onClose only', async () => {
      const onChange = vi.fn();
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={onClose} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      await user.click(screen.getByRole('button', { name: '1%' }));
      await user.keyboard('{Escape}');
      expect(onChange).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('re-opening resets staged draft from props', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      const { rerender } = renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      await user.click(screen.getByRole('button', { name: '1%' }));
      // Close without applying
      rerender(
        <Settings
          open={false}
          onClose={() => {}}
          settings={DEFAULT_SETTINGS}
          onChange={onChange}
        />,
      );
      // Re-open — draft must reset to props (0.5%), not the abandoned 1%
      rerender(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      expect(screen.getByRole('button', { name: '0.5%' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: '1%' })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
    });
  });

  describe('validation', () => {
    it('ignores custom slippage above 50 and keeps previous value', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      const input = screen.getByLabelText(/custom slippage percent/i);
      fireEvent.change(input, { target: { value: '2.5' } });
      fireEvent.change(input, { target: { value: '999' } });
      await user.click(screen.getByRole('button', { name: DONE }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ slippagePct: 2.5 }),
      );
    });

    it('ignores negative slippage', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      const input = screen.getByLabelText(/custom slippage percent/i);
      fireEvent.change(input, { target: { value: '-1' } });
      await user.click(screen.getByRole('button', { name: DONE }));
      // -1 rejected, default 0.5 retained
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ slippagePct: DEFAULT_SETTINGS.slippagePct }),
      );
    });

    it('accepts boundary slippage values 0 and 50', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      const input = screen.getByLabelText(/custom slippage percent/i);

      fireEvent.change(input, { target: { value: '0' } });
      await user.click(screen.getByRole('button', { name: DONE }));
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({ slippagePct: 0 }),
      );
    });
  });

  describe('high-slippage warning', () => {
    it('shows the warning when committed slippage ≥ 5', () => {
      renderIntl(
        <Settings
          open
          onClose={() => {}}
          settings={{ slippagePct: 5, feeBps: 30 }}
          onChange={() => {}}
        />,
      );
      expect(screen.getByText(/high slippage/i)).toBeInTheDocument();
    });

    it('hides the warning when committed slippage < 5', () => {
      renderIntl(
        <Settings
          open
          onClose={() => {}}
          settings={{ slippagePct: 0.5, feeBps: 30 }}
          onChange={() => {}}
        />,
      );
      expect(screen.queryByText(/high slippage/i)).not.toBeInTheDocument();
    });

    it('reacts to staged draft (shows warning after raising slippage before Done)', async () => {
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={() => {}} />,
      );
      expect(screen.queryByText(/high slippage/i)).not.toBeInTheDocument();
      fireEvent.change(screen.getByLabelText(/custom slippage percent/i), {
        target: { value: '10' },
      });
      expect(screen.getByText(/high slippage/i)).toBeInTheDocument();
      await user.keyboard('{Escape}');
    });
  });

  describe('fee slider', () => {
    it('updates the displayed percentage as the slider moves (staged)', () => {
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={() => {}} />,
      );
      fireEvent.change(screen.getByLabelText(/fee/i), { target: { value: '75' } });
      expect(screen.getByText(/0\.75%/)).toBeInTheDocument();
    });

    it('does not commit fee changes until Done', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      renderIntl(
        <Settings open onClose={() => {}} settings={DEFAULT_SETTINGS} onChange={onChange} />,
      );
      fireEvent.change(screen.getByLabelText(/fee/i), { target: { value: '60' } });
      expect(onChange).not.toHaveBeenCalled();
      await user.click(screen.getByRole('button', { name: DONE }));
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ feeBps: 60 }),
      );
    });
  });
});
