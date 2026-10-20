import { ArrowRight, User } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
	BOOKING_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	RIDE_STATUS_LABELS,
	enumLabel,
} from '../../lib/enums';
import { fmtDateTime, fmtKz } from '../../lib/format';
import type { AdminBooking, AdminRideStop } from '../../types/admin';

interface BookingDetailModalProps {
	booking: AdminBooking | null;
	onClose: () => void;
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<p className="text-xs uppercase text-text-secondary">{label}</p>
			<div className="mt-0.5 text-sm text-text">{value}</div>
		</div>
	);
}

/**
 * Os índices de embarque/desembarque são posições na lista de paragens.
 *
 * A lista chega ordenada por `sequence`; a função aceita as duas leituras
 * porque `sequence` começa em 0 e é contígua, mas se um dia deixar de ser, a
 * posição já não é a mesma coisa que o número da paragem.
 */
function stopAt(stops: AdminRideStop[], index: number): AdminRideStop | null {
	return (
		stops.find((stop) => stop.sequence === index) ?? stops[index] ?? null
	);
}

function StopCard({
	label,
	stop,
	fallback,
}: {
	label: string;
	stop: AdminRideStop | null;
	fallback: number;
}) {
	return (
		<div className="rounded-lg border p-3">
			<p className="text-xs uppercase text-text-secondary">{label}</p>
			{stop ? (
				<>
					<p className="mt-1 text-sm font-sansBold text-text">
						{stop.name}
					</p>
					<p className="text-xs text-text-secondary">
						{stop.timeLabel}
						{stop.locality
							? ` · ${stop.locality.name}, ${stop.locality.municipality}`
							: ''}
					</p>
				</>
			) : (
				<p className="mt-1 text-sm text-text-secondary">
					Paragem #{fallback + 1} (já não existe no itinerário)
				</p>
			)}
		</div>
	);
}

/**
 * Ficha de uma reserva.
 *
 * O que faltava era o segmento: uma reserva não é a corrida toda, é do
 * `pickStopIndex` ao `dropStopIndex`. Sem isso, o operador via a rota e o
 * valor, mas não sabia onde a pessoa entra nem onde sai — exactamente o que
 * se pergunta quando há uma disputa sobre o preço ou o ponto de encontro.
 */
export function BookingDetailModal({
	booking,
	onClose,
}: BookingDetailModalProps) {
	const pickup = booking
		? stopAt(booking.ride.stops, booking.pickStopIndex)
		: null;
	const dropoff = booking
		? stopAt(booking.ride.stops, booking.dropStopIndex)
		: null;

	return (
		<Modal
			open={booking !== null}
			onClose={onClose}
			title="Ficha da reserva"
			size="xl"
		>
			{booking ? (
				<div className="space-y-6">
					<div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-background p-4">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-lg font-sansBold text-text">
									{booking.passenger.name}
								</h3>
								<StatusBadge
									status={booking.status}
									label={enumLabel(
										BOOKING_STATUS_LABELS,
										booking.status,
									)}
								/>
							</div>
							<p className="mt-1 text-sm text-text-secondary">
								{booking.passenger.phone ?? 'Sem telefone'}
							</p>
							<p className="mt-0.5 font-mono text-xs text-text-secondary">
								{booking.id}
							</p>
						</div>
						<div className="rounded-md bg-surface px-3 py-2 text-right">
							<p className="text-xs uppercase text-text-secondary">
								Total
							</p>
							<p className="text-lg font-sansBold">
								{fmtKz(booking.amount)}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Info label="Lugares" value={String(booking.seats)} />
						<Info
							label="Pagamento"
							value={enumLabel(
								PAYMENT_METHOD_LABELS,
								booking.paymentMethod,
							)}
						/>
						<Info
							label="Pedida"
							value={fmtDateTime(booking.createdAt)}
						/>
						<Info
							label="Corrida"
							value={
								<StatusBadge
									status={booking.ride.status}
									label={enumLabel(
										RIDE_STATUS_LABELS,
										booking.ride.status,
									)}
								/>
							}
						/>
					</div>

					{booking.reason ? (
						<div className="rounded-lg border border-warning/30 bg-warning/5 p-3">
							<p className="text-xs font-sansBold text-warning">
								Motivo registado
							</p>
							<p className="mt-1 text-sm text-text">
								{booking.reason}
							</p>
						</div>
					) : null}

					<section>
						<h4 className="mb-2 text-sm font-sansBold text-text">
							{booking.ride.routeName}
						</h4>
						<p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-text-secondary">
							{fmtDateTime(booking.ride.departureAt)}
							<ArrowRight size={12} />
							{fmtDateTime(booking.ride.arrivalAt)}
						</p>
						<div className="grid gap-3 sm:grid-cols-2">
							<StopCard
								label="Embarque"
								stop={pickup}
								fallback={booking.pickStopIndex}
							/>
							<StopCard
								label="Desembarque"
								stop={dropoff}
								fallback={booking.dropStopIndex}
							/>
						</div>
					</section>

					<div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
						<div>
							<h4 className="flex items-center gap-2 text-sm font-sansBold text-text">
								<User
									size={15}
									className="text-text-secondary"
								/>
								Motorista
							</h4>
							<div className="mt-2 space-y-1 text-sm">
								<p className="text-text">
									{booking.ride.driver.name}
								</p>
								<p className="text-text-secondary">
									{booking.ride.driver.phone ??
										'Sem telefone'}
								</p>
							</div>
						</div>
						<div>
							<h4 className="text-sm font-sansBold text-text">
								Viatura
							</h4>
							<div className="mt-2 space-y-1 text-sm">
								{booking.ride.vehicle ? (
									<>
										<p className="font-mono text-text">
											{booking.ride.vehicle.plate}
										</p>
										<p className="text-text-secondary">
											{booking.ride.vehicle.make}{' '}
											{booking.ride.vehicle.model}
										</p>
									</>
								) : (
									<p className="text-text-secondary">
										Sem viatura associada
									</p>
								)}
							</div>
						</div>
					</div>
				</div>
			) : null}
		</Modal>
	);
}
