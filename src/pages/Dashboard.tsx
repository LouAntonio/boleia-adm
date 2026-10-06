import { useNavigate } from 'react-router-dom';
import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from 'recharts';
import { StatsCard } from '../components/ui/StatsCard';
import { PageHeader } from '../components/ui/PageHeader';
import { useAdminStats } from '../hooks/queries/useAdmin';
import {
	Users,
	Route,
	ClipboardCheck,
	Car,
	Ticket,
	ArrowRight,
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

/**
 * Painel de controlo da Boleia.
 *
 * Os números vêm de `GET /api/admin/stats`, que os agrega numa transacção só
 * de leituras. As contagens por estado chegam sem chaves para os valores que
 * nunca ocorreram, por isso tudo é lido com `?? 0` — um cartão com
 * `undefined` é pior do que um cartão com zero.
 */
export function Dashboard() {
	const navigate = useNavigate();
	const { data, isLoading, error } = useAdminStats({ days: 14 });

	const m = data?.metrics;

	const quickActions = [
		{
			label: 'Rever pedidos de KYC',
			to: '/kyc',
			icon: ClipboardCheck,
			count: m?.pendingKyc ?? 0,
		},
		{
			label: 'Rever viaturas',
			to: '/vehicles',
			icon: Car,
			count: m?.pendingVehicleReview ?? 0,
		},
		{
			label: 'Reservas por decidir',
			to: '/bookings',
			icon: Ticket,
			count: m?.pendingBookings ?? 0,
		},
	];

	return (
		<div>
			<PageHeader
				title="Painel de controlo"
				subtitle="Operação da Boleia em Angola"
				icon={Route}
			/>

			{error ? (
				<div className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-small text-error">
					Não foi possível carregar as métricas. Verifica a ligação ao
					servidor.
				</div>
			) : null}

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
				{isLoading || !m ? (
					<>
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
						<SkeletonCard />
					</>
				) : (
					<>
						<StatsCard
							label="Utilizadores"
							value={m.totalUsers}
							subtitle={`${
								m.usersByRole.DRIVER ?? 0
							} motoristas · ${m.usersByRole.USER ?? 0} passageiros`}
							icon={Users}
							delay={0}
						/>
						<StatsCard
							label="Corridas agendadas"
							value={m.rides.SCHEDULED ?? 0}
							subtitle={`${m.rides.IN_PROGRESS ?? 0} em curso · ${
								m.rides.COMPLETED ?? 0
							} concluídas`}
							icon={Route}
							delay={100}
						/>
						<StatsCard
							label="Reservas confirmadas"
							value={m.bookings.CONFIRMED ?? 0}
							subtitle={`${m.bookings.REQUESTED ?? 0} por decidir`}
							icon={Ticket}
							delay={200}
						/>
						<StatsCard
							label="KYC por rever"
							value={m.pendingKyc}
							subtitle={`${m.pendingDriverKyc} motorista · ${
								m.pendingPassengerKyc
							} passageiro`}
							icon={ClipboardCheck}
							delay={300}
						/>
					</>
				)}
			</div>

			<div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
				<div className="lg:col-span-2 rounded-xl border bg-surface p-5 shadow-card">
					<h3 className="mb-4 text-label font-sansBold">
						Corridas publicadas — últimos 14 dias
					</h3>
					{isLoading ? (
						<SkeletonChart />
					) : (
						<ResponsiveContainer width="100%" height={260}>
							<AreaChart
								data={data?.rideFlow ?? []}
								margin={{
									top: 8,
									right: 8,
									left: -20,
									bottom: 0,
								}}
							>
								<defs>
									<linearGradient
										id="rideGradient"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--primary)"
											stopOpacity={0.3}
										/>
										<stop
											offset="95%"
											stopColor="var(--primary)"
											stopOpacity={0}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke="var(--border)"
								/>
								<XAxis
									dataKey="date"
									tick={{
										fontSize: 11,
										fill: 'var(--text-secondary)',
									}}
									tickLine={false}
									axisLine={false}
								/>
								<YAxis
									allowDecimals={false}
									tick={{
										fontSize: 11,
										fill: 'var(--text-secondary)',
									}}
									tickLine={false}
									axisLine={false}
								/>
								<Tooltip
									contentStyle={{
										background: 'var(--surface)',
										border: '1px solid var(--border)',
										borderRadius: 8,
										fontSize: 12,
									}}
								/>
								<Area
									type="monotone"
									dataKey="count"
									name="Corridas"
									stroke="var(--primary)"
									strokeWidth={2}
									fill="url(#rideGradient)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					)}
				</div>

				<div className="rounded-xl border bg-surface p-5 shadow-card">
					<h3 className="mb-4 text-label font-sansBold">
						A precisar de ti
					</h3>
					<div className="space-y-2">
						{quickActions.map((action) => (
							<button
								key={action.to}
								type="button"
								onClick={() => navigate(action.to)}
								className="flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors hover:bg-background"
							>
								<action.icon
									size={18}
									className="text-primary"
								/>
								<span className="flex-1 text-body-small font-sansMedium">
									{action.label}
								</span>
								{action.count > 0 ? (
									<span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-sansBold text-white">
										{action.count}
									</span>
								) : null}
								<ArrowRight
									size={14}
									className="text-text-secondary"
								/>
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
