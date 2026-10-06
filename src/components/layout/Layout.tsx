import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';

export function Layout() {
	const token = useAuthStore((s) => s.token);
	const sidebarOpen = useAppStore((s) => s.sidebarOpen);

	if (!token) {
		return <Navigate to="/login" replace />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Sidebar />
			<div
				className={`transition-all duration-300 ${
					sidebarOpen ? 'ml-60' : 'ml-16'
				}`}
			>
				<Header />
				<main className="p-6">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
