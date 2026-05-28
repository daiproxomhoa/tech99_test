import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from '../Sparkline';

describe('Sparkline', () => {
  it('renders an SVG with an a11y label', () => {
    const { container } = render(<Sparkline symbol="ETH" price={2500} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('aria-label')).toContain('ETH');
  });

  it('renders the polyline + filled area', () => {
    const { container } = render(<Sparkline symbol="ETH" price={2500} />);
    expect(container.querySelector('polyline')).toBeTruthy();
    expect(container.querySelector('polygon')).toBeTruthy();
  });
});
