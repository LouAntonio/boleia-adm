import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { useLogout } from '../../hooks/useAuth';
import { Menu } from 'lucide-react';
import { enumLabel, USER_ROLE_LABELS } from '../../lib/enums';

const pathLabels: Record<string, string> = {
	'': 'Painel de controlo',
	users: 'Utilizadores',
	kyc: 'KYC',
	vehicles: 'Viaturas',
	rides: 'Corridas',
	bookings: 'Reservas',
	'audit-logs': 'Auditoria',
};

export function Header() {
	const user = useAuthStore((s) => s.user);
	const toggleSidebar = useAppStore((s) => s.toggleSidebar);
	const logout = useLogout();
	const location = useLocation();
	const navigate = useNavigate();

	if (!user) return null;

	const pathParts = location.pathname.split('/').filter(Boolean);
	const breadcrumbs =
		pathParts.length === 0
			? [{ label: 'Dashboard', path: '/' }]
			: pathParts.map((part, i) => ({
					label: pathLabels[part] ?? part,
					path: '/' + pathParts.slice(0, i + 1).join('/'),
				}));

	return (
		<header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-surface/80 px-4 backdrop-blur-sm">
			<div className="flex items-center gap-3">
				<button
					onClick={toggleSidebar}
					className="flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-background hover:text-text transition-colors"
					title="Alternar sidebar"
				>
					<Menu size={20} />
				</button>

				<nav className="hidden items-center gap-1.5 text-sm md:flex">
					{breadcrumbs.map((crumb, i) => (
						<span
							key={crumb.path}
							className="flex items-center gap-1.5"
						>
							{i > 0 && (
								<span className="text-text-secondary/40">
									/
								</span>
							)}
							<button
								onClick={() => navigate(crumb.path)}
								className={`transition-colors hover:text-text ${
									i === breadcrumbs.length - 1
										? 'font-medium text-text'
										: 'text-text-secondary'
								}`}
							>
								{crumb.label}
							</button>
						</span>
					))}
				</nav>
			</div>

			<div className="flex items-center gap-3">
				<div className="hidden text-right text-xs md:block">
					<p className="font-medium text-text">{user.name}</p>
					<p className="text-text-secondary">
						{enumLabel(USER_ROLE_LABELS, user.role)}
					</p>
				</div>
				<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
					{user.name?.charAt(0)}
				</div>
				<button
					onClick={() => logout.mutate()}
					className="rounded-lg px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-background hover:text-error transition-colors"
				>
					Sair
				</button>
			</div>
		</header>
	);
}
