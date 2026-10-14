import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAdminBookings } from '../../hooks/queries/useAdmin';
import {
	BOOKING_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	enumLabel,
} from '../../lib/enums';
import type { AdminBooking } from '../../types/admin';
import { Ticket } from 'lucide-react';

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	...Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({
		value,
		label,
	})),
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
 * Todas as reservas da plataforma.
 *
 * Só de leitura, pela mesma razão que as corridas: decidir ou cancelar uma
 * reserva é do motorista, e o backend não expõe uma operação administrativa
 * disso. Ver o estado é o que um moderador precisa quando há uma reclamação.
 */
export function BookingList() {
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');

	const { data, isLoading, error, refetch } = useAdminBookings({
		page,
		limit: 20,
		status: status || undefined,
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const columns: Column<AdminBooking>[] = [
		{
			key: 'passenger',
			label: 'Passageiro',
			sortable: true,
			render: (b) => (
				<div>
					<div className="text-body-small font-sansBold">
						{b.passenger.name}
					</div>
					<div className="text-xs text-text-secondary">
						{b.passenger.phone ?? '—'}
					</div>
				</div>
			),
		},
		{
			key: 'ride',
			label: 'Corrida',
			render: (b) => (
				<div>
					<div className="text-body-small">{b.ride.routeName}</div>
					<div className="text-xs text-text-secondary">
						{b.ride.driver.name} · {fmtDateTime(b.ride.departureAt)}
					</div>
				</div>
			),
		},
		{
			key: 'seats',
			label: 'Lugares',
			render: (b) => `${b.seats}`,
		},
		{
			key: 'amount',
			label: 'Valor',
			sortable: true,
			render: (b) => (
				<div>
					<div className="text-body-small">{kz.format(b.amount)}</div>
					<div className="text-xs text-text-secondary">
						{enumLabel(PAYMENT_METHOD_LABELS, b.paymentMethod)}
					</div>
				</div>
			),
		},
		{
			key: 'status',
			label: 'Estado',
			sortable: true,
			render: (b) => (
				<div>
					<StatusBadge
						status={b.status}
						label={enumLabel(BOOKING_STATUS_LABELS, b.status)}
					/>
					{b.reason ? (
						<p className="mt-1 max-w-[220px] text-xs text-text-secondary">
							{b.reason}
						</p>
					) : null}
				</div>
			),
		},
		{
			key: 'createdAt',
			label: 'Pedida',
			sortable: true,
			render: (b) => fmtDateTime(b.createdAt),
		},
	];

	return (
		<div>
			<PageHeader
				title="Reservas"
				subtitle="Pedidos de boleia de toda a plataforma"
				icon={Ticket}
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
					emptyMessage="Ainda não há reservas."
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
