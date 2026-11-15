'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export function useQueryParams() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const entries: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }, [searchParams]);

  const setParams = useCallback(
    (newParams: Record<string, string | number | null | undefined>, resetPage = true) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));

      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') {
          current.delete(key);
        } else {
          current.set(key, String(value));
        }
      });

      if (resetPage && !('page' in newParams)) {
        current.delete('page');
      }

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearParams = useCallback(
    (keysToKeep: string[] = []) => {
      const current = new URLSearchParams(Array.from(searchParams.entries()));
      const allKeys = Array.from(current.keys());

      allKeys.forEach((key) => {
        if (!keysToKeep.includes(key)) {
          current.delete(key);
        }
      });

      const search = current.toString();
      const query = search ? `?${search}` : '';
      router.push(`${pathname}${query}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return {
    params,
    searchParams,
    setParams,
    clearParams,
  };
}
