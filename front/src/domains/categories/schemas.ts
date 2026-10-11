import { z } from 'zod';
const CATEGORY_TYPES = ['INCOME', 'EXPENSE', 'BOTH'] as const;

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome da categoria deve ter pelo menos 2 caracteres.')
    .max(50, 'O nome da categoria deve ter no máximo 50 caracteres.'),
  type: z.enum(CATEGORY_TYPES),
  icon: z.string().trim().min(1).max(40).default('tag'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida. Use formato hexadecimal (#RRGGBB).')
    .default('#eab308'),
});

export const updateCategorySchema = createCategorySchema.extend({
  id: z.string().min(1, 'ID da categoria é obrigatório.'),
});

export const toggleArchiveCategorySchema = z.object({
  id: z.string().min(1, 'ID da categoria é obrigatório.'),
  isArchived: z.boolean(),
});

export const deleteCategorySchema = z.object({
  id: z.string().min(1, 'ID da categoria é obrigatório.'),
});

export const listCategoriesFilterSchema = z
  .object({
    includeArchived: z.boolean().optional().default(false),
    type: z.enum(['ALL', 'INCOME', 'EXPENSE', 'BOTH']).optional().default('ALL'),
  })
  .optional();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type ToggleArchiveCategoryInput = z.infer<
  typeof toggleArchiveCategorySchema
>;
export type ListCategoriesFilter = z.infer<typeof listCategoriesFilterSchema>;
