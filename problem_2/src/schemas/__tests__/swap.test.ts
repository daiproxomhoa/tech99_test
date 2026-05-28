import { describe, expect, it } from 'vitest';
import { swapSchema } from '../swap';

describe('swapSchema', () => {
  const valid = { fromSymbol: 'ETH', toSymbol: 'USDC', amount: '1.5' };

  it('accepts a valid form', () => {
    expect(swapSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects identical tokens with a message key', () => {
    const r = swapSchema.safeParse({ ...valid, toSymbol: 'ETH' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0].message).toBe('differ');
    }
  });

  it('rejects empty amount', () => {
    const r = swapSchema.safeParse({ ...valid, amount: '' });
    expect(r.success).toBe(false);
  });

  it('rejects zero amount', () => {
    const r = swapSchema.safeParse({ ...valid, amount: '0' });
    expect(r.success).toBe(false);
  });

  it('rejects negative amounts', () => {
    const r = swapSchema.safeParse({ ...valid, amount: '-1' });
    expect(r.success).toBe(false);
  });
});
