import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '../types/admin';

export interface AuthState {
	/**
	 * O utilizador da sessão, para leitura durante o render.
	 *
	 * Isto **não** é a fonte de verdade da sessão — é uma projecção de
	 * `authClient.useSession()`, escrita num único sítio (`AuthSync`) e nunca
	 * usada para decidir se há sessão. O que decide é o `useSession()`, porque a
	 * sessão vive num cookie que o JavaScript não consegue ler: só o servidor
	 * responde se é válida.
	 *
	 * Existe por causa de dois consumidores que não podem usar um hook:
	 * `getStorageKey()` em `useAppStore`, que corre fora do React para
	 * namespocar a preferência da sidebar por pessoa, e o `partialize` abaixo.
	 */
	user: SessionUser | null;
	setUser: (user: SessionUser | null) => void;
	/** Esvazia a projecção. A sessão em si é terminada pelo `authClient`. */
	logout: () => void;
}

/**
 * `version: 1` com um `migrate` que deita tudo fora, de propósito.
 *
 * A versão 0 guardava o `token` da sessão em `localStorage`, sob a forma
 * `{ state: { token, user } }`. O `merge` do zustand é raso: sem esta migração o
 * `token` antigo continuaria no `localStorage` para sempre — nunca lido por
 * código novo, mas sempre exposto a qualquer script da página, que é
 * precisamente o que esta migração veio eliminar.
 *
 * O custo é uma sessão terminada. A pessoa entra outra vez e pronto.
 */
export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: null,
			setUser: (user) => set({ user }),
			logout: () => {
				// A chave também sai do `persist` no logout: deixar o user
				// rehidratado depois de um logout por 401 faria o `Layout`
				// mostrar um nome de conta que já não tem sessão.
				localStorage.removeItem('boleia-adm-auth');
				set({ user: null });
			},
		}),
		{
			name: 'boleia-adm-auth',
			version: 1,
			migrate: () => ({
				user: null,
				setUser: () => {},
				logout: () => {},
			}),
			// Só o essencial sobrevive ao recarregamento. O resto da conta é
			// revalidado contra o servidor pelo `useSession`; guardar o objecto
			// inteiro faria o painel mostrar o nome de uma conta já apagada.
			partialize: (state) =>
				({
					user: state.user
						? {
								...(state.user as SessionUser),
								id: state.user.id,
								name: state.user.name,
								email: state.user.email,
								role: state.user.role,
							}
						: null,
				}) as AuthState,
		},
	),
);
