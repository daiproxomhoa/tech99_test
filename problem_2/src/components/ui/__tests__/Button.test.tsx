import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children and fires onClick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(<Button onClick={onClick}>Click me</Button>);
    await user.click(screen.getByRole('button', { name: 'Click me' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables the button when loading and renders a spinner', () => {
    render(<Button loading>Submitting</Button>);
    const btn = screen.getByRole('button', { name: /submitting/i });
    expect(btn).toBeDisabled();
    expect(btn.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('honors the disabled prop independently of loading', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    render(
      <Button disabled onClick={onClick}>
        Off
      </Button>,
    );
    await user.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('forwards the variant class', () => {
    render(<Button variant="danger">x</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-danger');
  });
});
