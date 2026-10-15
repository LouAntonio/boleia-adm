import { useEffect } from 'react';
import { authClient, sessionUserFrom } from '../../lib/auth-client';
import { useAuthStore } from '../../stores/useAuthStore';

/**
 * Escreve o utilizador da sessão no store, uma única vez, a partir do
 * `useSession()`.
 *
 * Existe para os consumidores que não podem ser hooks — o `getStorageKey()` do
 * `useAppStore` corre fora do React, e o `partialize` do store de auth
 * precisa de saber o `id` para namespocar as preferências por pessoa. O que
 * decide se há sessão é sempre o `useSession()`; isto é cache de leitura.
 *
 * Montado uma vez, no `App`. Não devolve nada.
 */
export function AuthSync() {
	const { data } = authClient.useSession();
	const setUser = useAuthStore((s) => s.setUser);

	useEffect(() => {
		setUser(data?.user ? sessionUserFrom(data.user) : null);
	}, [data, setUser]);

	return null;
}
