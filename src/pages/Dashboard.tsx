import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/axios';
import { StatsCard } from '../components/ui/StatsCard';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from 'recharts';
import {
	Users,
	FileText,
	CreditCard,
	UserPlus,
	ShieldCheck,
	ArrowRight,
	Wallet,
} from 'lucide-react';

function SkeletonCard() {
	return (
		<div className="animate-skeleton rounded-xl border bg-surface p-5 shadow-card">
			<div className="flex items-start justify-between">
				<div className="space-y-2">
					<div className="h-3 w-20 rounded bg-border/50" />
					<div className="h-7 w-16 rounded bg-border/50" />
					<div className="h-3 w-28 rounded bg-border/50" />
				</div>
				<div className="h-10 w-10 rounded-lg bg-border/50" />
			</div>
		</div>
	);
}

function SkeletonChart() {
	return (
		<div className="animate-skeleton rounded-xl border bg-surface p-5 shadow-card">
			<div className="mb-4 h-4 w-40 rounded bg-border/50" />
			<div className="h-64 rounded bg-border/30" />
		</div>
	);
}

export function Dashboard() {
	const navigate = useNavigate();

	const { data: dashboard, isLoading } = useQuery({
		queryKey: ['admin', 'dashboard'],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/dashboard');
			return data.data;
		},
	});

	const metrics = dashboard?.metrics;
	const transcriptionFlow: { date: string; count: number }[] =
		dashboard?.transcriptionFlow ?? [];

	const chartData = transcriptionFlow.map((d) => ({
		date: d.date,
		transcricoes: d.count,
	}));

	const totalTranscriptions = metrics?.totalTranscriptions ?? 0;
	const totalUsers = metrics?.totalUsers ?? 0;
	const totalSubscriptions = metrics?.totalActiveSubscriptions ?? 0;
	const totalPayments = metrics?.totalPayments ?? 0;

	const quickActions = [
		{
			label: 'Criar Utilizador',
			icon: UserPlus,
			onClick: () => navigate('/users/create'),
			color: 'text-primary bg-primary/10',
		},
		{
			label: 'Ver Transcrições',
			icon: FileText,
			onClick: () => navigate('/transcriptions'),
			color: 'text-accent bg-accent/10',
		},
		{
			label: 'Gerir Planos',
			icon: ShieldCheck,
			onClick: () => navigate('/plans'),
			color: 'text-success bg-success/10',
		},
	];

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold font-display text-text">
						Dashboard
					</h1>
					<p className="mt-0.5 text-sm text-text-secondary">
						Visão geral da plataforma
					</p>
				</div>
			</div>

			{isLoading ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{Array.from({ length: 4 }).map((_, i) => (
						<SkeletonCard key={i} />
					))}
				</div>
			) : (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					<StatsCard
						label="Utilizadores"
						value={totalUsers}
						subtitle="Registados na plataforma"
						icon={Users}
						delay={0}
					/>
					<StatsCard
						label="Subscrições Activas"
						value={totalSubscriptions}
						subtitle="Planos activos"
						icon={Wallet}
						delay={100}
					/>
					<StatsCard
						label="Transcrições"
						value={totalTranscriptions}
						subtitle="Total processado"
						icon={FileText}
						delay={200}
					/>
					<StatsCard
						label="Pagamentos"
						value={totalPayments}
						subtitle="Transacções registadas"
						icon={CreditCard}
						delay={300}
					/>
				</div>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2">
					{isLoading ? (
						<SkeletonChart />
					) : (
						<div className="rounded-xl border bg-surface p-5 shadow-card">
							<div className="mb-1 flex items-center justify-between">
								<div>
									<h2 className="text-sm font-medium text-text">
										Fluxo de Transcrições
									</h2>
									<p className="text-xs text-text-secondary">
										Últimos 7 dias
									</p>
								</div>
							</div>
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={chartData}>
										<defs>
											<linearGradient
												id="routeGradient"
												x1="0"
												y1="0"
												x2="0"
												y2="1"
											>
												<stop
													offset="0%"
													stopColor="#FF5A26"
													stopOpacity={0.3}
												/>
												<stop
													offset="60%"
													stopColor="#FF5A26"
													stopOpacity={0.08}
												/>
												<stop
													offset="100%"
													stopColor="#FF5A26"
													stopOpacity={0}
												/>
											</linearGradient>
										</defs>
										<CartesianGrid
											strokeDasharray="3 3"
											stroke="var(--border)"
											vertical={false}
										/>
										<XAxis
											dataKey="date"
											tick={{
												fontSize: 11,
												fill: 'var(--text-secondary)',
											}}
											axisLine={false}
											tickLine={false}
											interval="preserveStartEnd"
										/>
										<YAxis
											allowDecimals={false}
											tick={{
												fontSize: 11,
												fill: 'var(--text-secondary)',
											}}
											axisLine={false}
											tickLine={false}
											width={30}
										/>
										<Tooltip
											contentStyle={{
												background: 'var(--surface)',
												border: '1px solid var(--border)',
												borderRadius: '8px',
												boxShadow:
													'0 4px 6px -1px rgba(0,0,0,0.06)',
											}}
											labelStyle={{
												color: 'var(--text)',
											}}
										/>
										<Area
											type="monotone"
											dataKey="transcricoes"
											stroke="#FF5A26"
											strokeWidth={2}
											fill="url(#routeGradient)"
											dot={false}
											activeDot={{
												r: 4,
												fill: '#FF5A26',
												stroke: '#fff',
												strokeWidth: 2,
											}}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</div>
						</div>
					)}
				</div>

				<div className="space-y-4">
					<div className="rounded-xl border bg-surface p-5 shadow-card">
						<h2 className="mb-3 text-sm font-medium text-text">
							Acções Rápidas
						</h2>
						<div className="space-y-2">
							{quickActions.map((action) => (
								<button
									key={action.label}
									onClick={action.onClick}
									className="flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors hover:bg-background group"
								>
									<div
										className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${action.color}`}
									>
										<action.icon size={18} />
									</div>
									<span className="flex-1 font-medium text-text">
										{action.label}
									</span>
									<ArrowRight
										size={16}
										className="text-text-secondary opacity-0 transition-opacity group-hover:opacity-100"
									/>
								</button>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
