import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAdminRides } from '../../hooks/queries/useAdmin';
import {
	RIDE_SCOPE_LABELS,
	RIDE_STATUS_LABELS,
	enumLabel,
} from '../../lib/enums';
import { fmtDateTime, fmtKz } from '../../lib/format';
import type { AdminRide } from '../../types/admin';
import { Route } from 'lucide-react';

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	{ value: 'SCHEDULED', label: RIDE_STATUS_LABELS.SCHEDULED },
	{ value: 'IN_PROGRESS', label: RIDE_STATUS_LABELS.IN_PROGRESS },
	{ value: 'COMPLETED', label: RIDE_STATUS_LABELS.COMPLETED },
	{ value: 'CANCELLED', label: RIDE_STATUS_LABELS.CANCELLED },
];

const SCOPE_OPTIONS = [
	{ value: '', label: 'Todos os modos' },
	{ value: 'INTERMUNICIPAL', label: RIDE_SCOPE_LABELS.INTERMUNICIPAL },
	{ value: 'INTERPROVINCIAL', label: RIDE_SCOPE_LABELS.INTERPROVINCIAL },
];

/**
 * Todas as corridas da plataforma.
 *
 * Endpoint distinto do `GET /api/rides` que a app usa: a pesquisa pública só
 * devolve agendadas com lugares livres e dentro da janela de pesquisa, pelo
 * que uma corrida cancelada de ontem — exactamente a que um administrador
 * vai querer investigar — não aparecia.
 *
 * Clicar na linha abre a ficha da corrida: itinerário, motorista, viatura e
 * reservas. A ficha é uma página, não um modal, para que o URL possa ser
 * guardado ou passado a outro moderador. Esta listagem continua só de leitura:
 * cancelar a corrida de outra pessoa não existe no backend, e um botão que
 * devolvesse 404 seria pior que não o ter.
 */
export function RideList() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [scope, setScope] = useState('');

	const { data, isLoading, error, refetch } = useAdminRides({
		page,
		limit: 20,
		status: status || undefined,
		scope: scope || undefined,
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
						{fmtDateTime(r.departureAt)} ·{' '}
						{enumLabel(RIDE_SCOPE_LABELS, r.scope)}
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
				<span className="text-body-small">{fmtKz(r.pricePerSeat)}</span>
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
					{ key: 'scope', label: 'Modo', options: SCOPE_OPTIONS },
				]}
				filterValues={{ status, scope }}
				onFilterChange={(key, value) => {
					if (key === 'status') setStatus(value ?? '');
					if (key === 'scope') setScope(value ?? '');
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
					onRowClick={(ride) =>
						navigate(`/rides/${encodeURIComponent(ride.id)}`)
					}
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
