import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/api/endpoints';
import { useAuthStore } from '@/store/auth';

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
 * если httpOnly refresh-cookie ещё валидна.
 */
export function useBootstrapAuth() {
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (accessToken) return;
    authApi
      .refresh()
      .then((r) => setAccessToken(r.accessToken))
      .catch(() => {
        // нет валидной сессии
      });
  }, [accessToken, setAccessToken]);
}
