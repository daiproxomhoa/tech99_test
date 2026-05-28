import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from '../Dialog';

describe('Dialog', () => {
  it('does not render children when closed', () => {
    render(
      <Dialog open={false} onClose={() => {}}>
        <p>panel</p>
      </Dialog>,
    );
    expect(screen.queryByText('panel')).not.toBeInTheDocument();
  });

  it('renders children when open and labels via labelledBy', () => {
    render(
      <Dialog open onClose={() => {}} labelledBy="t">
        <h2 id="t">Title</h2>
        <input data-testid="first-input" />
      </Dialog>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 't');
    expect(screen.getByText('Title')).toBeInTheDocument();
  });

  it('closes on Escape', () => {
    const onClose = vi.fn();
    render(
      <Dialog open onClose={onClose}>
        <button>x</button>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('closes when the backdrop is clicked but not when the panel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Dialog open onClose={onClose}>
        <button data-testid="inside">x</button>
      </Dialog>,
    );
    await user.click(screen.getByTestId('inside'));
    expect(onClose).not.toHaveBeenCalled();
    // Click the backdrop (parent of dialog role)
    const dialog = screen.getByRole('dialog');
    const backdrop = dialog.parentElement!;
    await user.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('locks body scroll while open and restores after close', () => {
    const { rerender } = render(
      <Dialog open onClose={() => {}}>
        <p>x</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(
      <Dialog open={false} onClose={() => {}}>
        <p>x</p>
      </Dialog>,
    );
    expect(document.body.style.overflow).not.toBe('hidden');
  });

  it('focuses the first interactive element on open', async () => {
    render(
      <Dialog open onClose={() => {}}>
        <input data-testid="first" />
        <button>second</button>
      </Dialog>,
    );
    // queueMicrotask runs after current task — flush
    await Promise.resolve();
    expect(screen.getByTestId('first')).toHaveFocus();
  });

  it('Tab from last focusable wraps to first', () => {
    render(
      <Dialog open onClose={() => {}}>
        <button data-testid="a">a</button>
        <button data-testid="b">b</button>
        <button data-testid="c">c</button>
      </Dialog>,
    );
    const c = screen.getByTestId('c');
    c.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByTestId('a')).toHaveFocus();
  });

  it('Shift+Tab from first focusable wraps to last', () => {
    render(
      <Dialog open onClose={() => {}}>
        <button data-testid="a">a</button>
        <button data-testid="b">b</button>
        <button data-testid="c">c</button>
      </Dialog>,
    );
    const a = screen.getByTestId('a');
    a.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(screen.getByTestId('c')).toHaveFocus();
  });

  it('Tab without focusable children does not crash', () => {
    render(
      <Dialog open onClose={() => {}}>
        <p>no focusables</p>
      </Dialog>,
    );
    expect(() => fireEvent.keyDown(document, { key: 'Tab' })).not.toThrow();
  });

  it('restores focus to the previously focused element on close', () => {
    const trigger = document.createElement('button');
    trigger.textContent = 'open';
    document.body.appendChild(trigger);
    trigger.focus();
    expect(trigger).toHaveFocus();

    const { rerender } = render(
      <Dialog open onClose={() => {}}>
        <button>inside</button>
      </Dialog>,
    );
    rerender(
      <Dialog open={false} onClose={() => {}}>
        <button>inside</button>
      </Dialog>,
    );
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('does not call onClose on Escape when closed', () => {
    const onClose = vi.fn();
    render(
      <Dialog open={false} onClose={onClose}>
        <p>x</p>
      </Dialog>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
