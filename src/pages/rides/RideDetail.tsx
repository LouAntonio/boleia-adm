import { useNavigate, useParams, Link } from 'react-router-dom';
import {
	ArrowLeft,
	Clock,
	Mail,
	MapPin,
	Phone,
	Route as RouteIcon,
	User,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useAdminRideDetail } from '../../hooks/queries/useAdmin';
import {
	BOOKING_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	RIDE_STATUS_LABELS,
	RIDE_STOP_KIND_LABELS,
	VERIFICATION_STATUS_LABELS,
	enumLabel,
} from '../../lib/enums';
import { fmtDateTime, fmtKz } from '../../lib/format';
import type { AdminRideDetailBooking } from '../../types/admin';

/**
 * Ficha de uma corrida.
 *
 * Substituiu o modal: uma investigação precisa de rolar o itinerário, comparar
 * reservas e abrir contactos sem perder o sítio. A página tem URL próprio, por
 * isso também se pode guardar ou partilhar com outro moderador.
 */
export function RideDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: ride, isLoading, isError } = useAdminRideDetail(id);

	if (isLoading) {
		return (
			<p className="text-body-small text-text-secondary">A carregar…</p>
		);
	}

	if (isError || !ride) {
		return (
			<div className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-small text-error">
				Não foi possível carregar esta corrida.
			</div>
		);
	}

	const currentStop =
		ride.stops.length > 0 ? (ride.stops[ride.progressIndex] ?? null) : null;
	const totalBooked = ride.bookings
		.filter((booking) =>
			['CONFIRMED', 'IN_PROGRESS', 'COMPLETED'].includes(booking.status),
		)
		.reduce((sum, booking) => sum + booking.amount, 0);

	return (
		<div>
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="mb-4 inline-flex items-center gap-1.5 text-sm font-sansMedium text-text-secondary hover:text-text"
			>
				<ArrowLeft size={16} />
				Voltar
			</button>

			<PageHeader
				title={ride.routeName}
				subtitle={`${fmtDateTime(ride.departureAt)} → ${fmtDateTime(ride.arrivalAt)} · ${durationBetween(ride.departureAt, ride.arrivalAt)}`}
				icon={RouteIcon}
				actions={
					<>
						<StatusBadge
							status={ride.status}
							label={enumLabel(RIDE_STATUS_LABELS, ride.status)}
						/>
						{ride.bookings.length > 0 ? (
							<Link
								to={`/bookings?rideId=${encodeURIComponent(ride.id)}`}
								className="rounded-md border px-3 py-2 text-sm font-sansMedium text-primary hover:bg-primary/5"
							>
								Ver reservas
							</Link>
						) : null}
					</>
				}
			/>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="flex flex-col gap-4 lg:col-span-2">
					<section className="rounded-xl border bg-surface p-5 shadow-card">
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
								label="Progresso"
								value={
									ride.stops.length === 0
										? 'Sem paragens'
										: `${ride.progressIndex + 1} de ${ride.stops.length}`
								}
							/>
							<Info
								label="Receita confirmada"
								value={fmtKz(totalBooked)}
							/>
						</div>
					</section>

					<section className="rounded-xl border bg-surface p-5 shadow-card">
						<h2 className="mb-4 flex items-center gap-2 text-label font-sansBold text-text">
							<MapPin size={16} className="text-text-secondary" />
							Itinerário
						</h2>

						{ride.stops.length === 0 ? (
							<p className="rounded-lg bg-background p-3 text-sm text-text-secondary">
								Esta corrida não tem paragens registadas.
							</p>
						) : (
							<>
								<ol className="relative space-y-4 border-l border-line pl-5">
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
													{stop.timeLabel}
												</div>
											</div>
											{stop.locality ? (
												<p className="mt-0.5 text-xs text-text-secondary">
													{stop.locality.name},{' '}
													{stop.locality.municipality}{' '}
													·{' '}
													{
														stop.locality.province
															.name
													}
												</p>
											) : null}
										</li>
									))}
								</ol>

								<p className="mt-5 flex items-center gap-2 border-t pt-4 text-sm text-text-secondary">
									<Clock size={15} />
									Do início ao fim:{' '}
									{durationBetween(
										ride.departureAt,
										ride.arrivalAt,
									)}
									{currentStop
										? ` · agora em ${currentStop.name}`
										: ''}
								</p>
							</>
						)}
					</section>

					<Bookings
						bookings={ride.bookings}
						stops={ride.stops.map((stop) => stop.name)}
					/>
				</div>

				<div className="flex flex-col gap-4">
					<section className="rounded-xl border bg-surface p-5 shadow-card">
						<h2 className="flex items-center gap-2 text-label font-sansBold text-text">
							<User size={16} className="text-text-secondary" />
							Motorista
						</h2>
						<div className="mt-3 space-y-1.5 text-sm">
							<p className="text-text">
								{ride.driver.name}
								{ride.driver.surname
									? ` ${ride.driver.surname}`
									: ''}
							</p>
							{ride.driver.phone ? (
								<a
									href={`tel:${ride.driver.phone}`}
									className="flex items-center gap-1.5 text-primary hover:underline"
								>
									<Phone size={13} />
									{ride.driver.phone}
								</a>
							) : (
								<p className="text-text-secondary">
									Sem telefone
								</p>
							)}
							<a
								href={`mailto:${ride.driver.email}`}
								className="flex items-center gap-1.5 break-all text-primary hover:underline"
							>
								<Mail size={13} />
								{ride.driver.email}
							</a>
							<Link
								to={`/users/${ride.driver.id}`}
								className="mt-2 inline-block text-small font-sansMedium text-primary hover:underline"
							>
								Abrir conta do motorista
							</Link>
						</div>
					</section>

					<section className="rounded-xl border bg-surface p-5 shadow-card">
						<h2 className="text-label font-sansBold text-text">
							Viatura
						</h2>
						{ride.vehicle ? (
							<div className="mt-3 space-y-1.5 text-sm">
								<p className="font-mono text-text">
									{ride.vehicle.plate}
								</p>
								<p className="text-text">
									{ride.vehicle.make} {ride.vehicle.model}
								</p>
								<p className="text-text-secondary">
									{ride.vehicle.color} · {ride.vehicle.seats}{' '}
									lugares
								</p>
								<p className="text-text-secondary">
									Viatura{' '}
									{enumLabel(
										VERIFICATION_STATUS_LABELS,
										ride.vehicle.status,
									).toLowerCase()}
								</p>
							</div>
						) : (
							<p className="mt-3 text-sm text-text-secondary">
								Sem viatura associada.
							</p>
						)}
					</section>

					<section className="rounded-xl border bg-surface p-5 shadow-card">
						<h2 className="text-label font-sansBold text-text">
							Registo
						</h2>
						<dl className="mt-3 space-y-3 text-sm">
							<Info
								label="Preço por lugar"
								value={fmtKz(ride.pricePerSeat)}
							/>
							<Info
								label="Criada"
								value={fmtDateTime(ride.createdAt)}
							/>
							<Info
								label="Actualizada"
								value={fmtDateTime(ride.updatedAt)}
							/>
							<Info label="ID" value={ride.id} mono />
						</dl>
					</section>
				</div>
			</div>
		</div>
	);
}

function Info({
	label,
	value,
	mono,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<p className="text-xs uppercase text-text-secondary">{label}</p>
			<p
				className={`mt-0.5 break-all text-sm text-text ${mono ? 'font-mono' : ''}`}
			>
				{value}
			</p>
		</div>
	);
}

function Bookings({
	bookings,
	stops,
}: {
	bookings: AdminRideDetailBooking[];
	stops: string[];
}) {
	const active = bookings.filter((booking) =>
		['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status),
	);
	const past = bookings.filter(
		(booking) =>
			!['REQUESTED', 'CONFIRMED', 'IN_PROGRESS'].includes(booking.status),
	);

	return (
		<section className="rounded-xl border bg-surface p-5 shadow-card">
			<h2 className="text-label font-sansBold text-text">
				Reservas ({bookings.length})
			</h2>

			{bookings.length === 0 ? (
				<p className="mt-3 rounded-lg bg-background p-3 text-sm text-text-secondary">
					Ninguém reservou esta corrida.
				</p>
			) : (
				<div className="mt-4 space-y-4">
					{active.length > 0 ? (
						<BookingGroup
							title={`Activas (${active.length})`}
							bookings={active}
							stops={stops}
						/>
					) : null}
					{past.length > 0 ? (
						<BookingGroup
							title={`Histórico (${past.length})`}
							bookings={past}
							stops={stops}
						/>
					) : null}
				</div>
			)}
		</section>
	);
}

function BookingGroup({
	title,
	bookings,
	stops,
}: {
	title: string;
	bookings: AdminRideDetailBooking[];
	stops: string[];
}) {
	return (
		<div>
			<h3 className="mb-2 text-xs uppercase text-text-secondary">
				{title}
			</h3>
			<ul className="divide-y rounded-lg border">
				{bookings.map((booking) => (
					<li key={booking.id} className="p-3">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="min-w-0">
								<p className="text-sm text-text">
									{booking.passenger.name ?? 'Sem nome'}
									{booking.passenger.surname
										? ` ${booking.passenger.surname}`
										: ''}
								</p>
								<p className="mt-0.5 text-xs text-text-secondary">
									{booking.seats}{' '}
									{booking.seats === 1 ? 'lugar' : 'lugares'}{' '}
									· {fmtKz(booking.amount)} ·{' '}
									{enumLabel(
										PAYMENT_METHOD_LABELS,
										booking.paymentMethod,
									)}
								</p>
								<p className="mt-0.5 text-xs text-text-secondary">
									{stops[booking.pickStopIndex] ??
										`Paragem ${booking.pickStopIndex}`}{' '}
									→{' '}
									{stops[booking.dropStopIndex] ??
										`Paragem ${booking.dropStopIndex}`}
								</p>
								{booking.reason ? (
									<p className="mt-1 text-xs text-error">
										{booking.reason}
									</p>
								) : null}
							</div>
							<div className="flex flex-col items-end gap-1.5">
								<StatusBadge
									status={booking.status}
									label={enumLabel(
										BOOKING_STATUS_LABELS,
										booking.status,
									)}
								/>
								<p className="text-xs text-text-secondary">
									{fmtDateTime(booking.createdAt)}
								</p>
							</div>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}

/** Duração legível, calculada das duas datas em WAT. */
function durationBetween(from: string, to: string): string {
	const minutes = Math.round(
		(new Date(to).getTime() - new Date(from).getTime()) / 60_000,
	);
	if (!Number.isFinite(minutes) || minutes <= 0) {
		return 'Duração a confirmar';
	}
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} min`;
	if (rest === 0) return `${hours} h`;
	return `${hours} h ${rest} min`;
}
