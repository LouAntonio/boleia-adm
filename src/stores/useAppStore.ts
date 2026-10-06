import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

interface AppState {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
}

/**
 * Estado de UI guardado por utilizador.
 *
 * A preferência da sidebar é por pessoa: quem prefere a barra recolhida num ecrã
 * não a quer imposta ao utilizador seguinte na mesma máquina, e numa secretária
 * partilhada isso acontece.
 */
function getStorageKey(): string {
	const userId = useAuthStore.getState().user?.id;
	return `boleia-adm-app-${userId ?? 'anonymous'}`;
}

const perUserStorage = {
	getItem: () => {
		const raw = localStorage.getItem(getStorageKey());
		return raw ? JSON.parse(raw) : null;
	},
	setItem: (_: string, value: unknown) => {
		localStorage.setItem(getStorageKey(), JSON.stringify(value));
	},
	removeItem: () => {
		localStorage.removeItem(getStorageKey());
	},
};

export const useAppStore = create<AppState>()(
	persist(
		(set) => ({
			sidebarOpen: true,
			toggleSidebar: () =>
				set((state) => ({ sidebarOpen: !state.sidebarOpen })),
			setSidebarOpen: (open) => set({ sidebarOpen: open }),
		}),
		{
			name: 'boleia-adm-app',
			storage: perUserStorage,
		},
	),
);
