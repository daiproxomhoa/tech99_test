import { useCallback, useState } from 'react';

export type SwapStatus = 'idle' | 'submitting' | 'success' | 'error';

export interface SwapRequest {
  fromSymbol: string;
  toSymbol: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
}

export interface SwapResult extends SwapRequest {
  txHash: string;
}

const MOCK_LATENCY_MS = 1500;
const MOCK_FAILURE_RATE = 0.0;

function randomTxHash(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return (
    '0x' +
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  );
}

/**
 * Simulates a swap backend with a latency delay. Resolves with a fake tx
 * hash so the UI can show success state.
 */
export function useMockSwap() {
  const [status, setStatus] = useState<SwapStatus>('idle');
  const [lastResult, setLastResult] = useState<SwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(
    (req: SwapRequest): Promise<SwapResult> => {
      setStatus('submitting');
      setError(null);
      return new Promise((resolve, reject) => {
        window.setTimeout(() => {
          if (Math.random() < MOCK_FAILURE_RATE) {
            setStatus('error');
            const msg = 'Network error. Try again.';
            setError(msg);
            reject(new Error(msg));
            return;
          }
          const result: SwapResult = { ...req, txHash: randomTxHash() };
          setLastResult(result);
          setStatus('success');
          resolve(result);
        }, MOCK_LATENCY_MS);
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return { status, lastResult, error, submit, reset };
}
