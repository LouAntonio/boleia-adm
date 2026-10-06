import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import {
	useAdminVehicles,
	useReviewVehicle,
} from '../../hooks/queries/useAdmin';
import { VERIFICATION_STATUS_LABELS, enumLabel } from '../../lib/enums';
import { useCan } from '../../lib/permissions';
import type { AdminVehicle } from '../../types/admin';
import { Car, Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	{ value: 'PENDING', label: VERIFICATION_STATUS_LABELS.PENDING },
	{ value: 'VERIFIED', label: VERIFICATION_STATUS_LABELS.VERIFIED },
	{ value: 'REJECTED', label: VERIFICATION_STATUS_LABELS.REJECTED },
];

const fmtDate = (iso: string | null) =>
	iso ? new Date(iso).toLocaleDateString('pt-PT') : '—';

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
	const [deciding, setDeciding] = useState<{
		vehicle: AdminVehicle;
		decision: 'APPROVED' | 'REJECTED';
	} | null>(null);
	const canReview = useCan('moderate');
	const review = useReviewVehicle();

	const { data, isLoading } = useAdminVehicles({
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
						render: (v: AdminVehicle) => (
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() =>
										setDeciding({
											vehicle: v,
											decision: 'APPROVED',
										})
									}
									className="min-h-[32px] rounded-md bg-success px-3 py-1.5 text-xs font-sansBold text-white hover:opacity-90"
								>
									Aprovar
								</button>
								<button
									type="button"
									onClick={() =>
										setDeciding({
											vehicle: v,
											decision: 'REJECTED',
										})
									}
									className="min-h-[32px] rounded-md border px-3 py-1.5 text-xs font-sansBold text-error hover:bg-error/5"
								>
									Recusar
								</button>
							</div>
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

			<Modal
				open={deciding !== null}
				onClose={() => setDeciding(null)}
				title={
					deciding?.decision === 'APPROVED'
						? 'Aprovar viatura'
						: 'Recusar viatura'
				}
			>
				{deciding ? (
					<div className="space-y-4">
						<div className="rounded-lg bg-background p-3 text-body-small">
							<div className="font-mono font-sansBold">
								{deciding.vehicle.plate}
							</div>
							<div className="text-text-secondary">
								{deciding.vehicle.make} {deciding.vehicle.model}{' '}
								· {deciding.vehicle.seats} lugares
							</div>
						</div>
						<p className="text-body-small text-text-secondary">
							{deciding.decision === 'APPROVED'
								? 'O motorista passa a poder publicar corridas com esta viatura.'
								: 'A viatura volta ao estado de recusada e o motorista tem de a corrigir.'}
						</p>
						<button
							type="button"
							onClick={() => {
								if (!deciding) return;
								review.mutate(
									{
										id: deciding.vehicle.id,
										decision: deciding.decision,
									},
									{ onSuccess: () => setDeciding(null) },
								);
							}}
							disabled={review.isPending}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-sansBold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
						>
							{review.isPending ? (
								<Loader2 size={16} className="animate-spin" />
							) : null}
							Confirmar
						</button>
					</div>
				) : null}
			</Modal>
		</div>
	);
}
