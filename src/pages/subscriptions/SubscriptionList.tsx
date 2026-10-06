import { useState } from 'react';
import { useSubscriptions } from '../../hooks/queries/useSubscriptions';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatsCard } from '../../components/ui/StatsCard';
import { format } from 'date-fns';
import { enumLabel, SUBSCRIPTION_STATUS_LABELS } from '../../lib/enums';
import {
	Users,
	CheckCircle,
	Clock,
	XCircle,
	AlertTriangle,
} from 'lucide-react';

export function SubscriptionList() {
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const limit = 20;

	const cleanFilters = Object.fromEntries(
		Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
	);

	const { data, isLoading } = useSubscriptions({
		page,
		limit,
		...cleanFilters,
	});
	const result = data ?? {
		subscriptions: [],
		total: 0,
		stats: null as null | {
			total: number;
			byStatus: Record<string, number>;
		},
	};
	const subscriptions = result.subscriptions ?? [];
	const total = result.total ?? 0;
	const stats = result.stats;

	const handleFilterChange = (key: string, val: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: val }));
		setPage(1);
	};

	return (
		<div>
			<PageHeader
				title="Subscrições"
				subtitle="Subscrições de utilizadores na plataforma"
			/>

			{stats && (
				<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<StatsCard
						label="Total"
						value={stats.total}
						subtitle="Subscrições"
						icon={Users}
					/>
					<StatsCard
						label="Activas"
						value={stats.byStatus.ACTIVE ?? 0}
						subtitle={`${stats.total ? Math.round(((stats.byStatus.ACTIVE ?? 0) / stats.total) * 100) : 0}% do total`}
						icon={CheckCircle}
					/>
					<StatsCard
						label="Expiradas"
						value={stats.byStatus.EXPIRED ?? 0}
						subtitle={`${stats.total ? Math.round(((stats.byStatus.EXPIRED ?? 0) / stats.total) * 100) : 0}% do total`}
						icon={Clock}
					/>
					<StatsCard
						label="Canceladas"
						value={stats.byStatus.CANCELED ?? 0}
						subtitle={`${stats.total ? Math.round(((stats.byStatus.CANCELED ?? 0) / stats.total) * 100) : 0}% do total`}
						icon={XCircle}
					/>
					<StatsCard
						label="Vencidas"
						value={stats.byStatus.PAST_DUE ?? 0}
						subtitle={`${stats.total ? Math.round(((stats.byStatus.PAST_DUE ?? 0) / stats.total) * 100) : 0}% do total`}
						icon={AlertTriangle}
					/>
				</div>
			)}

			<div className="mb-4 flex flex-wrap items-end gap-3">
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Início (de)
					</label>
					<input
						type="date"
						value={filters.startDate ?? ''}
						onChange={(e) =>
							handleFilterChange(
								'startDate',
								e.target.value || undefined,
							)
						}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Início (até)
					</label>
					<input
						type="date"
						value={filters.endDate ?? ''}
						onChange={(e) =>
							handleFilterChange(
								'endDate',
								e.target.value || undefined,
							)
						}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					/>
				</div>
				{(filters.startDate || filters.endDate) && (
					<button
						onClick={() =>
							setFilters({
								startDate: undefined,
								endDate: undefined,
							})
						}
						className="rounded-lg border bg-background px-4 py-2 text-sm text-text-secondary hover:text-text"
					>
						Limpar datas
					</button>
				)}
			</div>

			<DataTable
				loading={isLoading}
				columns={[
					{
						key: 'user',
						label: 'Utilizador',
						render: (s) => s.user?.name ?? '—',
					},
					{
						key: 'plan',
						label: 'Plano',
						render: (s) => s.plan?.name ?? '—',
					},
					{
						key: 'status',
						label: 'Estado',
						render: (s) => {
							const v =
								s.status === 'ACTIVE'
									? 'success'
									: s.status === 'EXPIRED'
										? 'warning'
										: s.status === 'CANCELED'
											? 'error'
											: 'neutral';
							return (
								<StatusBadge
									status={s.status}
									variant={v as any}
									label={enumLabel(
										SUBSCRIPTION_STATUS_LABELS,
										s.status,
									)}
								/>
							);
						},
					},
					{
						key: 'startDate',
						label: 'Início',
						sortable: true,
						render: (s) =>
							format(new Date(s.startDate), 'dd/MM/yyyy'),
					},
					{
						key: 'endDate',
						label: 'Fim',
						render: (s) =>
							s.endDate
								? format(new Date(s.endDate), 'dd/MM/yyyy')
								: '—',
					},
					{
						key: 'renewalDate',
						label: 'Renovação',
						render: (s) =>
							s.renewalDate
								? format(new Date(s.renewalDate), 'dd/MM/yyyy')
								: '—',
					},
				]}
				data={subscriptions}
			/>

			<Pagination
				page={page}
				limit={limit}
				total={total}
				onPageChange={setPage}
			/>
		</div>
	);
}
