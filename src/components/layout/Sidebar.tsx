import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { useAppStore } from '../../stores/useAppStore';
import { useLogout } from '../../hooks/useAuth';
import { enumLabel, USER_ROLE_LABELS } from '../../lib/enums';
import {
	LayoutDashboard,
	Users,
	Currency,
	CreditCard,
	FileText,
	Wallet,
	Settings,
	ClipboardList,
	LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
	label: string;
	to: string;
	roles?: string[];
	icon: LucideIcon;
}

const navItems: NavItem[] = [
	{
		label: 'Dashboard',
		to: '/',
		icon: LayoutDashboard,
		roles: ['ADMIN', 'SUPPORT'],
	},
	{
		label: 'Utilizadores',
		to: '/users',
		icon: Users,
		roles: ['ADMIN'],
	},
	{
		label: 'Planos',
		to: '/plans',
		icon: Currency,
		roles: ['ADMIN'],
	},
	{
		label: 'Subscrições',
		to: '/subscriptions',
		icon: CreditCard,
		roles: ['ADMIN', 'SUPPORT'],
	},
	{
		label: 'Transcrições',
		to: '/transcriptions',
		icon: FileText,
		roles: ['ADMIN', 'SUPPORT'],
	},
	{
		label: 'Pagamentos',
		to: '/payments',
		icon: Wallet,
		roles: ['ADMIN'],
	},
	{
		label: 'Definições',
		to: '/settings',
		icon: Settings,
		roles: ['ADMIN'],
	},
	{
		label: 'Auditoria',
		to: '/audit-logs',
		icon: ClipboardList,
		roles: ['ADMIN', 'SUPPORT'],
	},
];

export function Sidebar() {
	const user = useAuthStore((s) => s.user);
	const sidebarOpen = useAppStore((s) => s.sidebarOpen);
	const logout = useLogout();

	const visibleItems = navItems.filter(
		(item) => !item.roles || (user && item.roles.includes(user.role)),
	);

	return (
		<aside
			className={`fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar text-white transition-all duration-300 ${
				sidebarOpen ? 'w-60' : 'w-16'
			}`}
		>
			<div
				className={`flex h-14 items-center border-b border-white/10 ${
					sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'
				}`}
			>
				<img
					src="/images/logo.png"
					alt="Kuzuela"
					className={`shrink-0 ${sidebarOpen ? 'h-7 w-7' : 'h-6 w-6'}`}
				/>
				{sidebarOpen && (
					<>
						<span className="text-lg font-bold font-display tracking-tight">
							Kuzuela
						</span>
						<span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/60">
							Admin
						</span>
					</>
				)}
			</div>

			<nav className="flex-1 overflow-y-auto px-2 py-3">
				{visibleItems.map((item) => (
					<NavLink
						key={item.to}
						to={item.to}
						end={item.to === '/'}
						className={({ isActive }) =>
							`group relative flex items-center rounded-lg text-sm transition-all duration-200 ${
								sidebarOpen
									? 'gap-3 px-3 py-2'
									: 'justify-center px-0 py-2.5'
							} ${
								isActive
									? 'bg-sidebar-active text-white font-medium'
									: 'text-white/60 hover:bg-sidebar-hover hover:text-white'
							}`
						}
					>
						{({ isActive }) => (
							<>
								{isActive && sidebarOpen && (
									<span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-white" />
								)}
								<item.icon
									size={20}
									className={`shrink-0 ${isActive ? 'text-white' : 'text-white/50 group-hover:text-white'}`}
								/>
								{sidebarOpen && (
									<span className="truncate">
										{item.label}
									</span>
								)}
								{!sidebarOpen && isActive && (
									<span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-white" />
								)}
							</>
						)}
					</NavLink>
				))}
			</nav>

			<div
				className={`border-t border-white/10 p-3 ${
					!sidebarOpen && 'flex flex-col items-center'
				}`}
			>
				{user && sidebarOpen && (
					<div className="mb-3 flex items-center gap-3 rounded-lg px-2 py-1.5">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
							{user.name?.charAt(0)}
						</div>
						<div className="min-w-0 flex-1">
							<p className="truncate text-sm font-medium text-white">
								{user.name}
							</p>
							<p className="truncate text-xs text-white/50">
								{enumLabel(USER_ROLE_LABELS, user.role)}
							</p>
						</div>
					</div>
				)}
				{user && !sidebarOpen && (
					<div className="mb-3 flex justify-center">
						<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
							{user.name?.charAt(0)}
						</div>
					</div>
				)}
				<button
					onClick={() => logout.mutate()}
					className={`flex items-center rounded-lg text-sm text-white/40 transition-colors hover:text-white ${
						sidebarOpen
							? 'gap-3 px-3 py-2'
							: 'justify-center px-0 py-2'
					}`}
					title={sidebarOpen ? undefined : 'Sair'}
				>
					<LogOut size={18} />
					{sidebarOpen && <span>Sair</span>}
				</button>
			</div>
		</aside>
	);
}
