import { useQuery } from '@tanstack/react-query';
import { fetchPrices, type Token } from '@/lib/tokens';

export function usePrices() {
  return useQuery<Token[], Error>({
    queryKey: ['prices'],
    queryFn: ({ signal }) => fetchPrices(signal),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}
