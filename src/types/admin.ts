import type { AdminRole } from '../lib/enums';

/** Utilizador como o backend o devolve (plugin `admin` do better-auth). */
export interface AdminUser {
	id: string;
	name: string;
	surname?: string | null;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	phone?: string | null;
	role: string;
	banned?: boolean | null;
	banReason?: string | null;
	banExpires?: string | null;
	createdAt: string;
	updatedAt?: string;
}

export interface SessionUser {
	id: string;
	name: string;
	surname?: string | null;
	email: string;
	role: string;
	image?: string | null;
	phone?: string | null;
	emailVerified?: boolean;
	createdAt?: string;
}

/** Envelope de paginação que o backend devolve nas listagens `api/admin/*`. */
export interface Paged<T> {
	rows: T[];
	total: number;
	page: number;
	limit: number;
}

/**
 * `GET /api/auth/admin/list-users`
 *
 * Devolve `{ users, total, limit, offset }` — a forma do plugin `admin` do
 * better-auth, diferente do envelope `{ rows, ... }` dos controllers Nest. A
 * distinção importa: são dois formatos e misturá-los dá paginação partida.
 */
export interface UserListResponse {
	users: AdminUser[];
	total: number;
	limit?: number;
	offset?: number;
}

export interface AdminVehicle {
	id: string;
	make: string;
	model: string;
	color: string;
	plate: string;
	seats: number;
	status: string;
	verifiedAt: string | null;
	createdAt: string;
	owner: { id: string; name: string; phone: string | null; email: string };
	_count: { rides: number };
}

/** Fotografia pronta a mostrar, com URL grande e miniatura. */
export interface MediaView {
	id: string;
	label: string | null;
	url: string;
	thumbnailUrl: string;
	width: number | null;
	height: number | null;
	createdAt: string;
}

/** `GET /api/admin/vehicles/:id` — a listagem não traz as fotos. */
export interface AdminVehicleDetail extends AdminVehicle {
	updatedAt: string;
	owner: {
		id: string;
		name: string;
		surname: string | null;
		phone: string | null;
		email: string;
		createdAt: string;
	};
	photos: MediaView[];
	_count: { rides: number };
}

/** Paragem de uma corrida, como o painel a mostra. */
export interface AdminRideStop {
	id: string;
	sequence: number;
	kind: string;
	name: string;
	timeLabel: string;
	distanceKm: number;
	locality: {
		id: string;
		code: string;
		municipality: string;
		name: string;
		province: { id: string; code: string; name: string };
	} | null;
}

export interface AdminRide {
	id: string;
	routeName: string;
	departureAt: string;
	arrivalAt: string;
	seatsTotal: number;
	seatsTaken: number;
	pricePerSeat: number;
	status: string;
	progressIndex: number;
	createdAt: string;
	driver: { id: string; name: string; phone: string | null };
	vehicle: {
		id: string;
		make: string;
		model: string;
		plate: string;
	} | null;
	stops: AdminRideStop[];
	_count: { bookings: number };
}

export interface AdminBooking {
	id: string;
	seats: number;
	amount: number;
	paymentMethod: string;
	status: string;
	reason: string | null;
	pickStopIndex: number;
	dropStopIndex: number;
	createdAt: string;
	passenger: { id: string; name: string; phone: string | null };
	ride: {
		id: string;
		routeName: string;
		departureAt: string;
		arrivalAt: string;
		status: string;
		driver: { id: string; name: string; phone: string | null };
		vehicle: {
			id: string;
			make: string;
			model: string;
			plate: string;
		} | null;
		stops: AdminRideStop[];
	};
}

/** Um pedido de KYC na fila de revisão. */
export interface KycRequest {
	id: string;
	userId: string;
	/**
	 * Nome da conta que submeteu os documentos.
	 *
	 * O KYC é só documentos — não há nome nem número de BI escritos no
	 * formulário. O painel identifica o pedido pela conta, e o revisor
	 * confere o resto na fotografia do BI.
	 *
	 * Os dois campos podem vir vazios: o registo aceita nome e apelido em
	 * branco (entra-se por telefone).
	 */
	user: { name: string | null; surname: string | null };
	status: string;
	/** Pode ser nulo: um registo por submeter não tem data de submissão. */
	submissionDate: string | null;
	createdAt: string;
}

/** `GET /api/kyc/driver/:id` e `/passenger/:id`. */
export interface KycDetail {
	id: string;
	userId: string;
	status: string;
	rejectionReason: string | null;
	submissionDate: string | null;
	verifiedAt: string | null;
	createdAt: string;
	account: {
		id: string;
		name: string | null;
		surname: string | null;
		phone: string | null;
		email: string;
		createdAt: string;
	};
	documents: MediaView[];
}

export interface AuditEntry {
	id: string;
	actorId: string | null;
	actorRole: string | null;
	actorName: string | null;
	actorEmail: string | null;
	action: string;
	entityType: string;
	entityId: string | null;
	metadata: Record<string, unknown> | null;
	ipAddress: string | null;
	userAgent: string | null;
	createdAt: string;
}

/**
 * Métricas do `GET /api/admin/stats`.
 *
 * As contagens por estado são mapas indexados pelo valor do enum, e vêm
 * deliberadamente sem chaves com valor zero: o painel tem de usar `?? 0` para
 * as que faltam, senão um estado que nunca ocorreu mostra `undefined` num
 * cartão.
 */
export interface AdminStats {
	metrics: {
		totalUsers: number;
		newUsersInWindow: number;
		rides: Record<string, number>;
		bookings: Record<string, number>;
		vehicles: Record<string, number>;
		usersByRole: Record<string, number>;
		pendingDriverKyc: number;
		pendingPassengerKyc: number;
		pendingKyc: number;
		pendingVehicleReview: number;
		pendingBookings: number;
	};
	rideFlow: { date: string; count: number }[];
	windowEnd: string | null;
}

export type { AdminRole };
