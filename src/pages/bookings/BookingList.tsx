import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { BookingDetailModal } from './BookingDetailModal';
import { useAdminBookings } from '../../hooks/queries/useAdmin';
import {
	BOOKING_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	enumLabel,
} from '../../lib/enums';
import { fmtDateTime, fmtKz } from '../../lib/format';
import type { AdminBooking } from '../../types/admin';
import { Ticket, X } from 'lucide-react';

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	...Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => ({
		value,
		label,
	})),
];

function stopName(booking: AdminBooking, index: number): string {
	const stop =
		booking.ride.stops.find((item) => item.sequence === index) ??
		booking.ride.stops[index];
	return stop?.name ?? `Paragem #${index + 1}`;
}

/**
 * Todas as reservas da plataforma.
 *
 * Só de leitura: decidir ou cancelar uma reserva é do motorista, e o backend
 * não expõe uma operação administrativa disso. Ver o estado é o que um
 * moderador precisa quando há uma reclamação.
 *
 * `?rideId=` filtra por uma corrida. É o que o botão «Ver reservas desta
 * corrida», na ficha da corrida, usa para responder à pergunta sem obrigar a
 * procurar à mão no meio de todas as reservas.
 */
export function BookingList() {
	const [searchParams, setSearchParams] = useSearchParams();
	const rideId = searchParams.get('rideId') ?? undefined;
	const [page, setPage] = useState(1);
	const [status, setStatus] = useState('');
	const [selected, setSelected] = useState<AdminBooking | null>(null);

	const { data, isLoading, error, refetch } = useAdminBookings({
		page,
		limit: 20,
		status: status || undefined,
		rideId,
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;
	const filteredRideName = rows[0]?.ride.routeName;

	useEffect(() => {
		setPage(1);
	}, [rideId]);

	const clearRide = () => {
		const next = new URLSearchParams(searchParams);
		next.delete('rideId');
		setSearchParams(next, { replace: true });
	};

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
						{stopName(b, b.pickStopIndex)} →{' '}
						{stopName(b, b.dropStopIndex)}
					</div>
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
					<div className="text-body-small">{fmtKz(b.amount)}</div>
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

			{rideId ? (
				<div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
					<p className="text-text">
						A mostrar só as reservas de{' '}
						<span className="font-sansBold">
							{filteredRideName ?? 'corrida seleccionada'}
						</span>
					</p>
					<button
						type="button"
						onClick={clearRide}
						className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-sansBold text-primary hover:bg-primary/10"
					>
						<X size={13} />
						Ver todas
					</button>
				</div>
			) : null}

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
					onRowClick={(booking) => setSelected(booking)}
					emptyMessage={
						rideId
							? 'Esta corrida ainda não tem reservas.'
							: 'Ainda não há reservas.'
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

			<BookingDetailModal
				booking={selected}
				onClose={() => setSelected(null)}
			/>
		</div>
	);
}
