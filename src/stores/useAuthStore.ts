import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
	id: string;
	name: string;
	email: string;
	role: string;
	image: string | null;
	emailVerified: boolean;
}

interface AuthState {
	token: string | null;
	user: User | null;
	setAuth: (token: string, user: User) => void;
	setUser: (user: User) => void;
	setToken: (token: string) => void;
	logout: () => void;
	isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
	persist(
		(set, get) => ({
			token: null,
			user: null,
			setAuth: (token, user) => set({ token, user }),
			setUser: (user) => set({ user }),
			setToken: (token) => set({ token }),
			logout: () => {
				localStorage.removeItem('kuzuela-auth');
				set({ token: null, user: null });
			},
			isAuthenticated: () => !!get().token,
		}),
		{ name: 'kuzuela-auth' },
	),
);
