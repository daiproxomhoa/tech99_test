import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders with shimmer classes and forwards className', () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).toContain('shimmer');
    expect(el.className).toContain('h-10');
    expect(el).toHaveAttribute('aria-hidden');
  });
});
