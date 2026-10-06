import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

interface AppState {
	sidebarOpen: boolean;
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
}

function getStorageKey(): string {
	const userId = useAuthStore.getState().user?.id;
	return `Kuzuela-app-${userId ?? 'anonymous'}`;
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
			name: 'Kuzuela-app',
			storage: perUserStorage,
		},
	),
);
