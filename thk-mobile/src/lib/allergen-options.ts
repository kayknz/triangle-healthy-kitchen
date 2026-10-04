import { supabase } from './supabase';

export type AllergenOption = { name: string; name_ar: string };

export const DEFAULT_ALLERGEN_OPTIONS: AllergenOption[] = [
  { name: 'Fish', name_ar: 'السمك' },
  { name: 'Dairy', name_ar: 'منتجات الألبان' },
  { name: 'Eggs', name_ar: 'البيض' },
  { name: 'Gluten', name_ar: 'الغلوتين' },
  { name: 'Seafood', name_ar: 'المأكولات البحرية' },
  { name: 'Sesame', name_ar: 'السمسم' },
  { name: 'Nuts', name_ar: 'المكسرات' },
];

export async function loadAllergenOptions(): Promise<AllergenOption[]> {
  const { data, error } = await supabase
    .from('allergen_options')
    .select('name,name_ar,is_active,sort_order')
    .eq('is_active', true)
    .order('sort_order')
    .order('name');

  if (error) return DEFAULT_ALLERGEN_OPTIONS;
  return (data || []).map((row: any) => ({ name: row.name, name_ar: row.name_ar || row.name }));
}
