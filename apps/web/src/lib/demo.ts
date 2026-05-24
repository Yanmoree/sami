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
