import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SessionUser } from '../types/admin';

export interface AuthState {
	token: string | null;
	user: SessionUser | null;
	setAuth: (token: string, user: SessionUser) => void;
	setUser: (user: SessionUser) => void;
	setToken: (token: string) => void;
	logout: () => void;
	isAuthenticated: () => boolean;
}

/**
 * `partialize` não guarda o `user` completo: só o `id` e o `role`.
 *
 * O role é o que o menu e as guardas de rota precisam para decidir o que
 * mostrar, e é a única coisa que faz sentido reter entre recargas — o resto da
 * conta é revalidado por `useMe` contra o servidor. Guardar o objecto inteiro
 * faria o painel mostrar um nome e um email possivelmente desatualizados (ou de
 * uma conta já apagada) sem dar por isso.
 */
export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			user: null,
			setAuth: (token, user) => set({ token, user }),
			setUser: (user) => set({ user }),
			setToken: (token) => set({ token }),
			logout: () => {
				// A chave também sai do `persist` no logout: deixar o user
				// rehidratado depois de um logout por 401 faria o `Layout`
				// considerar que há sessão e a mostrar o painel.
				localStorage.removeItem('boleia-adm-auth');
				set({ token: null, user: null });
			},
			isAuthenticated: () => !!get().token,
		}),
		{
			name: 'boleia-adm-auth',
			partialize: (state) =>
				({
					token: state.token,
					user: state.user
						? {
								...(state.user as SessionUser),
								// Só o essencial sobrevive ao recarregamento.
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
