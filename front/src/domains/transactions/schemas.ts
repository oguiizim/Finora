import { z } from 'zod';
const TRANSACTION_TYPES = ['INCOME', 'EXPENSE'] as const;

export const PERIOD_PRESETS = [
  'TODAY',
  'THIS_WEEK',
  'THIS_MONTH',
  'LAST_MONTH',
  'LAST_3_MONTHS',
  'LAST_6_MONTHS',
  'CUSTOM',
] as const;

export type PeriodPreset = (typeof PERIOD_PRESETS)[number];

export const baseTransactionSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
  description: z
    .string()
    .trim()
    .min(2, 'Informe uma descrição para o lançamento.')
    .max(120, 'A descrição deve ter no máximo 120 caracteres.'),
  amountInCents: z
    .number()
    .int('O valor deve ser representado em centavos inteiros.')
    .positive('O valor deve ser maior que zero.')
    .max(9999999999, 'Valor excede o limite permitido.'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida. Utilize o formato AAAA-MM-DD.'),
  categoryId: z.string().trim().nullable().optional(),
  notes: z
    .string()
    .trim()
    .max(500, 'A observação deve ter no máximo 500 caracteres.')
    .nullable()
    .optional(),
});

export const createTransactionSchema = baseTransactionSchema.superRefine(
  (val, ctx) => {
    if (val.type === 'EXPENSE' && (!val.categoryId || !val.categoryId.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Selecione uma categoria para a despesa.',
      });
    }
  },
);

export const updateTransactionSchema = baseTransactionSchema
  .extend({
    id: z.string().min(1, 'ID do lançamento é obrigatório.'),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'EXPENSE' && (!val.categoryId || !val.categoryId.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['categoryId'],
        message: 'Selecione uma categoria para a despesa.',
      });
    }
  });

export const deleteTransactionSchema = z.object({
  id: z.string().min(1, 'ID do lançamento é obrigatório.'),
});

export const listTransactionsFilterSchema = z
  .object({
    period: z.enum(PERIOD_PRESETS).optional().default('THIS_MONTH'),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.enum(['ALL', 'INCOME', 'EXPENSE']).optional().default('ALL'),
    categoryId: z.string().optional().default('ALL'),
    search: z.string().optional().default(''),
    sortBy: z.enum(['date', 'amount']).optional().default('date'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.number().int().min(1).optional().default(1),
    pageSize: z.number().int().min(5).max(200).optional().default(50),
  })
  .optional();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
export type ListTransactionsFilter = z.infer<
  typeof listTransactionsFilterSchema
>;
