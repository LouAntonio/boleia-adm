import { ArrowRight, MapPin, Route, User } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
	RIDE_STATUS_LABELS,
	RIDE_STOP_KIND_LABELS,
	enumLabel,
} from '../../lib/enums';
import { fmtDateTime, fmtKz } from '../../lib/format';
import type { AdminRide } from '../../types/admin';

interface RideDetailModalProps {
	ride: AdminRide | null;
	onClose: () => void;
	onOpenBookings: (rideId: string) => void;
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
 * Ficha de uma corrida.
 *
 * A listagem mostra rota, motorista e lotação; faltava o itinerário. Sem as
 * paragens não se percebe onde é que a corrida passa, nem o índice de
 * progresso — e é isso que um moderador precisa quando alguém reclama que o
 * motorista não passou no sítio combinado.
 */
export function RideDetailModal({
	ride,
	onClose,
	onOpenBookings,
}: RideDetailModalProps) {
	const currentStop =
		ride && ride.stops.length > 0
			? (ride.stops[ride.progressIndex] ?? null)
			: null;

	return (
		<Modal
			open={ride !== null}
			onClose={onClose}
			title="Ficha da corrida"
			size="xl"
		>
			{ride ? (
				<div className="space-y-6">
					<div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-background p-4">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-lg font-sansBold text-text">
									{ride.routeName}
								</h3>
								<StatusBadge
									status={ride.status}
									label={enumLabel(
										RIDE_STATUS_LABELS,
										ride.status,
									)}
								/>
							</div>
							<p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
								<Route size={14} />
								{fmtDateTime(ride.departureAt)}
								<ArrowRight size={12} />
								{fmtDateTime(ride.arrivalAt)}
							</p>
							<p className="mt-0.5 font-mono text-xs text-text-secondary">
								{ride.id}
							</p>
						</div>
						<div className="rounded-md bg-surface px-3 py-2 text-right">
							<p className="text-xs uppercase text-text-secondary">
								Preço por lugar
							</p>
							<p className="text-lg font-sansBold">
								{fmtKz(ride.pricePerSeat)}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Info
							label="Lugares"
							value={`${ride.seatsTaken}/${ride.seatsTotal}`}
						/>
						<Info
							label="Reservas"
							value={String(ride._count.bookings)}
						/>
						<Info
							label="Criada"
							value={fmtDateTime(ride.createdAt)}
						/>
						<Info
							label="Progresso"
							value={
								ride.stops.length === 0
									? 'Sem paragens'
									: currentStop
										? `${ride.progressIndex + 1} de ${ride.stops.length}`
										: '—'
							}
						/>
					</div>

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
								<p className="text-text">{ride.driver.name}</p>
								<p className="text-text-secondary">
									{ride.driver.phone ?? 'Sem telefone'}
								</p>
							</div>
						</div>
						<div>
							<h4 className="text-sm font-sansBold text-text">
								Viatura
							</h4>
							<div className="mt-2 space-y-1 text-sm">
								{ride.vehicle ? (
									<>
										<p className="font-mono text-text">
											{ride.vehicle.plate}
										</p>
										<p className="text-text-secondary">
											{ride.vehicle.make}{' '}
											{ride.vehicle.model}
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

					<section>
						<h4 className="mb-3 flex items-center gap-2 text-sm font-sansBold text-text">
							<MapPin size={15} className="text-text-secondary" />
							Itinerário
						</h4>
						{ride.stops.length === 0 ? (
							<p className="rounded-lg bg-background p-3 text-sm text-text-secondary">
								Esta corrida não tem paragens registadas.
							</p>
						) : (
							<ol className="relative space-y-3 border-l border-line pl-5">
								{ride.stops.map((stop, index) => (
									<li key={stop.id} className="relative">
										<span
											className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-surface ${
												index === ride.progressIndex
													? 'bg-primary'
													: 'bg-text-secondary/40'
											}`}
										/>
										<div className="flex flex-wrap items-baseline justify-between gap-2">
											<div>
												<span className="text-sm font-sansMedium text-text">
													{stop.name}
												</span>
												<span className="ml-2 rounded-full bg-background px-2 py-0.5 text-[11px] text-text-secondary">
													{enumLabel(
														RIDE_STOP_KIND_LABELS,
														stop.kind,
													)}
												</span>
												{index ===
												ride.progressIndex ? (
													<span className="ml-2 text-[11px] font-sansBold text-primary">
														actual
													</span>
												) : null}
											</div>
											<div className="text-xs text-text-secondary">
												{stop.timeLabel} ·{' '}
												{stop.distanceKm} km
											</div>
										</div>
										{stop.locality ? (
											<p className="mt-0.5 text-xs text-text-secondary">
												{stop.locality.name},{' '}
												{stop.locality.municipality} ·{' '}
												{stop.locality.province.name}
											</p>
										) : null}
									</li>
								))}
							</ol>
						)}
					</section>

					{ride._count.bookings > 0 ? (
						<button
							type="button"
							onClick={() => {
								onClose();
								onOpenBookings(ride.id);
							}}
							className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-sansBold text-primary hover:bg-primary/5"
						>
							Ver as {ride._count.bookings} reserva
							{ride._count.bookings === 1 ? '' : 's'} desta
							corrida
						</button>
					) : null}
				</div>
			) : null}
		</Modal>
	);
}
