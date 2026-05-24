import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';
import { DEMO_ACCESS_TOKEN, DEMO_USER, IS_DEMO } from '@/lib/demo';

/**
 * Подтягивает текущего пользователя, если есть accessToken.
 * При 401 интерцептор сам попытается refresh, иначе очистит стор.
 */
export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
    enabled: Boolean(accessToken),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);

  return query;
}

/**
 * При загрузке приложения тихо вызывает refresh, чтобы восстановить сессию,
 * если httpOnly refresh-cookie ещё валидна. В демо-режиме автоматически логиним
 * как DEMO_USER — без UI-флоу регистрации.
 */
export function useBootstrapAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (IS_DEMO) {
      if (!accessToken) setAuth(DEMO_USER, DEMO_ACCESS_TOKEN);
      return;
    }

    if (accessToken) return;
    authApi
      .refresh()
      .then((r: { accessToken: string }) => setAccessToken(r.accessToken))
      .catch(() => {
        // нет валидной сессии
      });
  }, [accessToken, setAuth, setAccessToken]);
}
