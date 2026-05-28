/**
 * Pure swap math. Prices are USD-denominated; the swap rate between two
 * tokens A → B is simply priceA / priceB.
 *
 * A mock fee is taken off the output amount so the UI can show a non-trivial
 * "you will receive" number.
 */

import type { Token } from './tokens';

export const DEFAULT_FEE_BPS = 30; // 0.30%
export const DEFAULT_SLIPPAGE_PCT = 0.5;

export interface Quote {
  /** Exchange rate: 1 unit of `from` is this many units of `to`. */
  rate: number;
  /** Output amount before fees. */
  outputGross: number;
  /** Output after the fee is subtracted. */
  outputNet: number;
  /** Fee in `to`-token units. */
  feeAmount: number;
  /** Minimum the user will receive given slippage tolerance. */
  minReceived: number;
}

export interface QuoteParams {
  from: Token;
  to: Token;
  amount: number;
  feeBps?: number;
  slippagePct?: number;
}

export function getRate(from: Token, to: Token): number {
  if (!from.price || !to.price) return 0;
  return from.price / to.price;
}

export function quote({
  from,
  to,
  amount,
  feeBps = DEFAULT_FEE_BPS,
  slippagePct = DEFAULT_SLIPPAGE_PCT,
}: QuoteParams): Quote {
  const rate = getRate(from, to);
  if (!rate || !Number.isFinite(amount) || amount <= 0) {
    return { rate, outputGross: 0, outputNet: 0, feeAmount: 0, minReceived: 0 };
  }
  const outputGross = amount * rate;
  const feeAmount = (outputGross * feeBps) / 10_000;
  const outputNet = outputGross - feeAmount;
  const minReceived = outputNet * (1 - slippagePct / 100);
  return { rate, outputGross, outputNet, feeAmount, minReceived };
}

/** Reverse: given a desired output amount, what input is needed (gross of fee)? */
export function reverseQuote({
  from,
  to,
  amount,
  feeBps = DEFAULT_FEE_BPS,
}: QuoteParams): number {
  const rate = getRate(from, to);
  if (!rate || !Number.isFinite(amount) || amount <= 0) return 0;
  // amount = input * rate * (1 - fee), so input = amount / (rate * (1 - fee))
  const feeFactor = 1 - feeBps / 10_000;
  return amount / (rate * feeFactor);
}
