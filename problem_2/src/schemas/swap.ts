import { z } from 'zod';
import { m } from '@/i18n/messages';
import type { MessageDescriptor } from 'react-intl';

/** Validation error tokens — the schema yields one of these, the UI maps them to `m.*`. */
export type ValidationKey =
  | 'selectFrom'
  | 'selectTo'
  | 'enterAmount'
  | 'positive'
  | 'number'
  | 'differ';

export const validationMessage: Record<ValidationKey, MessageDescriptor> = {
  selectFrom: m.validationSelectFrom,
  selectTo: m.validationSelectTo,
  enterAmount: m.validationEnterAmount,
  positive: m.validationPositive,
  number: m.validationNumber,
  differ: m.validationDiffer,
};

export const swapSchema = z
  .object({
    fromSymbol: z.string().min(1, 'selectFrom' satisfies ValidationKey),
    toSymbol: z.string().min(1, 'selectTo' satisfies ValidationKey),
    amount: z
      .string()
      .min(1, 'enterAmount' satisfies ValidationKey)
      .refine((v) => Number(v) > 0, 'positive' satisfies ValidationKey)
      .refine((v) => Number.isFinite(Number(v)), 'number' satisfies ValidationKey),
  })
  .refine((d) => d.fromSymbol !== d.toSymbol, {
    message: 'differ' satisfies ValidationKey,
    path: ['toSymbol'],
  });

export type SwapFormValues = z.infer<typeof swapSchema>;
