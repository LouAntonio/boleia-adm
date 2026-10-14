import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAdminRides } from '../../hooks/queries/useAdmin';
import { RIDE_STATUS_LABELS, enumLabel } from '../../lib/enums';
import type { AdminRide } from '../../types/admin';
import { Route } from 'lucide-react';

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	{ value: 'SCHEDULED', label: RIDE_STATUS_LABELS.SCHEDULED },
	{ value: 'IN_PROGRESS', label: RIDE_STATUS_LABELS.IN_PROGRESS },
	{ value: 'COMPLETED', label: RIDE_STATUS_LABELS.COMPLETED },
	{ value: 'CANCELLED', label: RIDE_STATUS_LABELS.CANCELLED },
];

const kz = new Intl.NumberFormat('pt-AO', {
	style: 'currency',
	currency: 'AOA',
	maximumFractionDigits: 0,
});

const fmtDateTime = (iso: string) =>
	new Date(iso).toLocaleString('pt-PT', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
	});

/**
 * Todas as corridas da plataforma.
 *
 * Endpoint distinto do `GET /api/rides` que a app usa: a pesquisa pública só
 * devolve agendadas com lugares livres e dentro da janela de pesquisa, pelo
 * que uma corrida cancelada de ontem — exactamente a que um administrador
 * vai querer investigar — não aparecia.
 *
 * Esta página é só de leitura. Não há accões de escrita: cancelar a corrida de
 * outra pessoa não existe no backend, e um botão que devolvesse 404 seria pior
 * que não o ter.
 */
export function RideList() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');

	const { data, isLoading, error, refetch } = useAdminRides({
		page,
		limit: 20,
		status: status || undefined,
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const columns: Column<AdminRide>[] = [
		{
			key: 'routeName',
			label: 'Rota',
			sortable: true,
			render: (r) => (
				<div>
					<div className="text-body-small font-sansBold">
						{r.routeName}
					</div>
					<div className="text-xs text-text-secondary">
						{fmtDateTime(r.departureAt)}
					</div>
				</div>
			),
		},
		{
			key: 'driver',
			label: 'Motorista',
			render: (r) => (
				<div>
					<div className="text-body-small">{r.driver.name}</div>
					<div className="text-xs text-text-secondary">
						{r.vehicle
							? `${r.vehicle.make} ${r.vehicle.model}`
							: 'Sem viatura'}
					</div>
				</div>
			),
		},
		{
			key: 'seats',
			label: 'Lugares',
			render: (r) => (
				<span className="text-body-small">
					{r.seatsTaken}/{r.seatsTotal}
				</span>
			),
		},
		{
			key: 'pricePerSeat',
			label: 'Preço',
			sortable: true,
			render: (r) => (
				<span className="text-body-small">
					{kz.format(r.pricePerSeat)}
				</span>
			),
		},
		{
			key: 'bookings',
			label: 'Reservas',
			render: (r) => String(r._count.bookings),
		},
		{
			key: 'status',
			label: 'Estado',
			sortable: true,
			render: (r) => (
				<StatusBadge
					status={r.status}
					label={enumLabel(RIDE_STATUS_LABELS, r.status)}
				/>
			),
		},
	];

	return (
		<div>
			<PageHeader
				title="Corridas"
				subtitle="Todas as corridas publicadas, em qualquer estado"
				icon={Route}
			/>

			<FilterBar
				selectFilters={[
					{ key: 'status', label: 'Estado', options: STATUS_OPTIONS },
				]}
				filterValues={{ status }}
				onFilterChange={(_key, value) => {
					setStatus(value ?? '');
					setPage(1);
				}}
			/>

			<div className="mt-4">
				<DataTable
					columns={columns}
					data={rows}
					loading={isLoading}
					error={error}
					onRetry={() => refetch()}
					emptyMessage="Ainda não há corridas publicadas."
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
		</div>
	);
}
