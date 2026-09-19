import { useEffect, useState } from 'react';
import { PACKAGES, type Package } from '@/types/booking';
import { supabase } from '@/lib/supabase';

type PackageRow = Package & {
  active?: boolean | null;
  sort_order?: number | null;
};

const normalizePackage = (row: PackageRow): Package => ({
  id: row.id,
  name: row.name,
  kcals: Number(row.kcals),
  price: Number(row.price),
  currency: row.currency,
  meals: row.meals,
  duration: row.duration,
  description: row.description,
  highlight: row.highlight,
  image: row.image,
});

export function usePackages() {
  const [packages, setPackages] = useState<Package[]>(PACKAGES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPackages() {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('packages')
        .select('id, name, kcals, price, currency, meals, duration, description, highlight, image, active, sort_order')
        .eq('active', true)
        .order('sort_order', { ascending: true })
        .order('kcals', { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        setError(fetchError.message);
        setPackages(PACKAGES);
      } else {
        setError(null);
        setPackages(data && data.length > 0 ? data.map(normalizePackage) : PACKAGES);
      }

      setLoading(false);
    }

    loadPackages();

    return () => {
      cancelled = true;
    };
  }, []);

  return { packages, loading, error };
}
