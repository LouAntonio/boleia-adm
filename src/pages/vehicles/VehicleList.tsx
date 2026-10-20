import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { VehicleDetailModal } from './VehicleDetailModal';
import { useAdminVehicles } from '../../hooks/queries/useAdmin';
import { VERIFICATION_STATUS_LABELS, enumLabel } from '../../lib/enums';
import { fmtDate } from '../../lib/format';
import { useCan } from '../../lib/permissions';
import type { AdminVehicle } from '../../types/admin';
import { Car } from 'lucide-react';

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	{ value: 'PENDING', label: VERIFICATION_STATUS_LABELS.PENDING },
	{ value: 'VERIFIED', label: VERIFICATION_STATUS_LABELS.VERIFIED },
	{ value: 'REJECTED', label: VERIFICATION_STATUS_LABELS.REJECTED },
];

/**
 * Revisão de viaturas.
 *
 * A listagem é global (`/api/admin/vehicles`), não as viaturas do utilizador
 * que está autenticado: uma viatura só pode ser revista por quem não é o dono,
 * por isso `GET /api/vehicles/mine` não serviria para nada.
 */
export function VehicleList() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');
	const [selection, setSelection] = useState<{
		vehicle: AdminVehicle;
		decision: 'APPROVED' | 'REJECTED' | null;
	} | null>(null);
	const canReview = useCan('moderate');

	const { data, isLoading, error, refetch } = useAdminVehicles({
		page,
		limit: 20,
		status: status || undefined,
		search: query || undefined,
	});

	const applySearch = (value: string) => {
		setSearch(value);
		setQuery(value);
		setPage(1);
	};

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const columns: Column<AdminVehicle>[] = [
		{
			key: 'plate',
			label: 'Matrícula',
			sortable: true,
			render: (v) => (
				<span className="font-mono text-body-small font-sansBold">
					{v.plate}
				</span>
			),
		},
		{
			key: 'make',
			label: 'Viatura',
			sortable: true,
			render: (v) => (
				<div>
					<div className="text-body-small">{`${v.make} ${v.model}`}</div>
					<div className="text-xs text-text-secondary">
						{v.color} · {v.seats} lugares
					</div>
				</div>
			),
		},
		{
			key: 'owner',
			label: 'Proprietário',
			render: (v) => (
				<div>
					<div className="text-body-small">{v.owner.name}</div>
					<div className="text-xs text-text-secondary">
						{v.owner.phone ?? v.owner.email}
					</div>
				</div>
			),
		},
		{
			key: 'rides',
			label: 'Viagens',
			render: (v) => String(v._count.rides),
		},
		{
			key: 'status',
			label: 'Estado',
			sortable: true,
			render: (v) => (
				<StatusBadge
					status={v.status}
					label={enumLabel(VERIFICATION_STATUS_LABELS, v.status)}
				/>
			),
		},
		{
			key: 'createdAt',
			label: 'Submetida',
			sortable: true,
			render: (v) => fmtDate(v.createdAt),
		},
		...(canReview
			? [
					{
						key: 'actions',
						label: 'Decisão',
						render: (v: AdminVehicle) =>
							v.status === 'PENDING' ? (
								<div className="flex gap-2">
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											setSelection({
												vehicle: v,
												decision: 'APPROVED',
											});
										}}
										className="min-h-[32px] rounded-md bg-success px-3 py-1.5 text-xs font-sansBold text-white hover:opacity-90"
									>
										Aprovar
									</button>
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											setSelection({
												vehicle: v,
												decision: 'REJECTED',
											});
										}}
										className="min-h-[32px] rounded-md border px-3 py-1.5 text-xs font-sansBold text-error hover:bg-error/5"
									>
										Recusar
									</button>
								</div>
							) : (
								<span className="text-xs text-text-secondary">
									—
								</span>
							),
					} as Column<AdminVehicle>,
				]
			: []),
	];

	return (
		<div>
			<PageHeader
				title="Viaturas"
				subtitle="Verificação das viaturas registadas por motoristas"
				icon={Car}
			/>

			<div className="space-y-3">
				<SearchInput
					onSearch={applySearch}
					placeholder="Procurar por matrícula, marca ou modelo"
				/>
				<FilterBar
					selectFilters={[
						{
							key: 'status',
							label: 'Estado',
							options: STATUS_OPTIONS,
						},
					]}
					filterValues={{ status }}
					onFilterChange={(_key, value) => {
						setStatus(value ?? '');
						setPage(1);
					}}
				/>
			</div>

			<div className="mt-4">
				<DataTable
					columns={columns}
					data={rows}
					loading={isLoading}
					error={error}
					onRetry={() => refetch()}
					onRowClick={(vehicle) =>
						setSelection({ vehicle, decision: null })
					}
					emptyMessage={
						search
							? `Nenhuma viatura para "${search}".`
							: 'Ainda não há viaturas registadas.'
					}
				/>
			</div>

			<div className="mt-4">
				<Pagination
					page={page}
					limit={20}
					total={total}
					onPageChange={setPage}
				/>
			</div>

			<VehicleDetailModal
				open={selection !== null}
				vehicleId={selection?.vehicle.id ?? null}
				initialDecision={selection?.decision ?? null}
				onClose={() => setSelection(null)}
			/>
		</div>
	);
}
