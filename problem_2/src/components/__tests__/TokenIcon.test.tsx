import { render, screen, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TokenIcon } from '../TokenIcon';

describe('TokenIcon', () => {
  it('renders the CDN <img> with size and alt', () => {
    render(<TokenIcon symbol="ETH" size={28} />);
    const img = screen.getByAltText('ETH icon') as HTMLImageElement;
    expect(img.src).toMatch(/tokens\/ETH\.svg$/);
    expect(img.width).toBe(28);
    expect(img.height).toBe(28);
  });

  it('falls back to a gradient initial when the image errors', () => {
    render(<TokenIcon symbol="ZZZ" />);
    const img = screen.getByAltText('ZZZ icon');
    act(() => {
      img.dispatchEvent(new Event('error'));
    });
    expect(screen.queryByAltText('ZZZ icon')).toBeNull();
    expect(screen.getByLabelText('ZZZ')).toHaveTextContent('Z');
  });
});
