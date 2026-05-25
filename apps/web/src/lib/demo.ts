/**
 * Демо-режим: фронт работает без бэкенда, все данные мокаются в localStorage.
 * Включается через `VITE_DEMO_MODE=true` при билде. Боевой код не трогается —
 * это switch в api/endpoints.ts.
 */
export const IS_DEMO =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_DEMO_MODE === 'true';

export const DEMO_USER = {
  id: 'demo-user',
  email: 'demo@sami.shop',
  firstName: 'Demo',
  lastName: 'User',
  phone: null,
  role: 'CUSTOMER' as const,
  createdAt: new Date().toISOString(),
};

export const DEMO_ACCESS_TOKEN = 'demo-access-token';

/**
 * Одноразовая миграция: удаляем старые ключи v1 после ребренда каталога.
 * Безопасно — выполняется при первой загрузке скрипта.
 */
if (IS_DEMO && typeof window !== 'undefined') {
  try {
    ['sami_demo_cart', 'sami_demo_orders', 'sami_demo_admin_products'].forEach((k) => {
      window.localStorage.removeItem(k);
    });
  } catch {
    /* ignore */
  }
}
