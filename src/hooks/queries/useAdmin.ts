import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/axios';
import { authClient, unwrap } from '../../lib/auth-client';
import type {
	AdminBooking,
	AdminRide,
	AdminRideDetail,
	AdminStats,
	AdminUser,
	AdminVehicle,
	AdminVehicleDetail,
	AuditEntry,
	KycDetail,
	KycRequest,
	Paged,
	UserListResponse,
} from '../../types/admin';

/**
 * Queries do painel contra o backend Boleia.
 *
 * Duas formas de resposta convivem, e a distinção não é um acidente:
 *
 * - Os **controllers Nest** em `api/admin/*` devolvem `{ rows, total, page, limit }`.
 * - O **plugin `admin` do better-auth** em `api/auth/admin/*` devolve
 *   `{ users, total, limit, offset }`.
 *
 * Misturar os dois padrões é o erro fácil: ler `data.rows` de uma resposta do
 * plugin daria `undefined` e uma página que crasha em vez de mostrar "nada
 * encontrado". Cada função abaixo documenta qual dos dois está a usar.
 */

const messages = {
	fallback: 'Ocorreu um erro. Tenta de novo.',
};

// ---------- Utilizadores (plugin admin do better-auth) ----------

/** Data como string, seja o que o servidor mandou. */
function isoOrEmpty(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === 'string' && value.length > 0) return value;
	return '';
}

/**
 * O utilizador do plugin `admin`, na forma que o painel consome.
 *
 * Duas diferenças, ambas reais:
 *
 * - As datas chegam como `Date` no tipo do `better-auth` (ele pressupõe que o
 *   cliente as sabe converter) mas são strings em JSON. O `fmtDate` do painel
 *   quer string.
 * - `surname` e `phone` são `additionalFields` do servidor. Estão na resposta —
 *   o backend envia o utilizador inteiro — mas o tipo `UserWithRole` do plugin
 *   `admin` é construído sobre o `User` base e não os inclui. Sem os declarar,
 *   o detalhe do utilizador mostrava o nome completo e o telefone vazios.
 *
 * O `role` fica como `string` e não como o par de chaves que o `adminClient()`
 * assume: o backend usa `USER`/`ADMIN`/`MODERATOR`/`SUPPORT`
 * (`back/src/auth/auth.ts:227`), não os dois roles por omissão da biblioteca.
 * Quem valida é o servidor; aqui é apenas o que o painel mostra.
 */
function toAdminUser(raw: unknown): AdminUser {
	const u = (raw ?? {}) as Record<string, unknown>;
	return {
		id: String(u.id ?? ''),
		name: String(u.name ?? ''),
		surname: (u.surname as string | null) ?? null,
		email: String(u.email ?? ''),
		emailVerified: Boolean(u.emailVerified),
		image: (u.image as string | null) ?? null,
		phone: (u.phone as string | null) ?? null,
		role: String(u.role ?? 'USER'),
		banned: (u.banned as boolean | null) ?? null,
		banReason: (u.banReason as string | null) ?? null,
		banExpires: (u.banExpires as string | null) ?? null,
		createdAt: isoOrEmpty(u.createdAt),
		updatedAt: isoOrEmpty(u.updatedAt) || undefined,
	};
}

export interface UserListParams {
	page?: number;
	limit?: number;
	search?: string;
	role?: string;
	/** Campo da pesquisa: `email` ou `name`. O backend ignora outros. */
	searchField?: 'email' | 'name';
	/** Controlo de paginação do backend. */
	sortBy?: string;
	sortDirection?: 'asc' | 'desc';
}

/**
 * `authClient.admin.listUsers()` → `GET /api/auth/admin/list-users`
 *
 * Usa paginação por `offset` (não por página): é o que o plugin expõe. O
 * `Pagination` do kit de UI é por página, por isso a conversão acontece aqui e
 * não na página. A resposta continua a ser `{ users, total, limit, offset }`,
 * tal como o `axios` devolvia — a forma não mudou, só quem a traz.
 */
export function useUsers(params: UserListParams = {}) {
	const limit = params.limit ?? 20;
	const page = params.page ?? 1;

	return useQuery({
		queryKey: ['users', params],
		queryFn: async () => {
			const res = await unwrap(
				authClient.admin.listUsers({
					query: {
						limit,
						offset: (page - 1) * limit,
						searchValue: params.search || undefined,
						searchField: params.searchField ?? 'name',
						filterField: params.role ? 'role' : undefined,
						filterValue: params.role || undefined,
						sortDirection: params.sortDirection,
					},
				}),
			);
			return {
				...res,
				users: (res.users ?? []).map(toAdminUser),
			} as UserListResponse;
		},
	});
}

/**
 * Detalhe de um utilizador.
 *
 * `getUser` devolve **o utilizador directamente**, não um envelope — confirmado
 * pelo tipo que o `adminClient` infere. O `UserDetail` lê `user.name` sobre o
 * resultado desta query.
 */
export function useUser(id: string | undefined) {
	return useQuery({
		queryKey: ['users', id],
		queryFn: () =>
			unwrap(
				authClient.admin.getUser({ query: { id: id as string } }),
			).then(toAdminUser),
		enabled: !!id,
		retry: false,
	});
}

/**
 * Altera o role de um utilizador.
 *
 * Só o ADMIN tem `user:['set-role']`; o botão fica escondido a quem não tem, e
 * o 403 aparece se alguém o tentar pela mesma via.
 */
export function useUpdateUserRole() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { userId: string; role: string }) =>
			unwrap(
				authClient.admin.setRole({
					userId: input.userId,
					/*
					 * O tipo do `adminClient()` sem opções Assume os dois roles
					 * por omissão da biblioteca, `user` e `admin`. Os deste
					 * produto são `USER`/`ADMIN`/`MODERATOR`/`SUPPORT`
					 * (`back/src/auth/auth.ts:227`). Declarar os roles aqui
					 * seria copiar o `ac` e o mapa de roles do servidor para o
					 * painel — duas listas de permissões para manter em
					 * sincronia, que é o que `permissions.ts` avisa que dá
					 * problemas. O servidor valida o role; este `as` só evita
					 * que o painel não aceite escrever o que o servidor aceitou.
					 */
					role: input.role as 'user',
				}),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Role actualizado');
		},
		onError: () => toast.error('Não foi possível alterar o role.'),
	});
}

export function useBanUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: {
			userId: string;
			banReason?: string;
			banExpiresIn?: number;
		}) =>
			unwrap(
				authClient.admin.banUser({
					userId: input.userId,
					banReason: input.banReason,
					banExpiresIn: input.banExpiresIn,
				}),
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Utilizador banido');
		},
		onError: () => toast.error('Não foi possível banir o utilizador.'),
	});
}

export function useUnbanUser() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (userId: string) =>
			unwrap(authClient.admin.unbanUser({ userId })),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Banimento levantado');
		},
		onError: () => toast.error('Não foi possível levantar o banimento.'),
	});
}

/** Sessões de um utilizador, para as poder revogar. */
export function useUserSessions(userId: string | undefined) {
	return useQuery({
		queryKey: ['users', userId, 'sessions'],
		queryFn: async () => {
			const res = await apiClient.get(
				`/api/admin/users/${userId}/sessions`,
				{ params: { limit: 100 } },
			);
			/*
			 * O backend devolve `device`, não `userAgent`
			 * (`sessions.service.ts`, `formatOwn`: `device: row.userAgent`). O
			 * painel lia `s.userAgent`, que chegava `undefined`, e o `??` do
			 * componente caía na fallback sem dar erro nenhum — o painel de
			 * sessões, que é onde se investiga um sequestro de conta, mostrava
			 * sempre "dispositivo desconhecido".
			 *
			 * `isCurrent` e `impersonatedBy` também vinham e eram ignorados: uma
			 * sessão de impersonação aparecia como outra qualquer.
			 */
			return res.data as Paged<{
				id: string;
				ipAddress: string | null;
				device: string | null;
				createdAt: string;
				expiresAt: string;
				isCurrent: boolean;
				impersonatedBy: string | null;
			}>;
		},
		enabled: !!userId,
	});
}

export function useRevokeUserSessions() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (userId: string) => {
			const res = await apiClient.post(
				`/api/admin/users/${userId}/sessions/revoke-all`,
			);
			return res.data;
		},
		onSuccess: (_data, userId) => {
			queryClient.invalidateQueries({
				queryKey: ['users', userId, 'sessions'],
			});
			queryClient.invalidateQueries({ queryKey: ['users'] });
			toast.success('Sessões revogadas');
		},
		onError: () => toast.error('Não foi possível revogar as sessões.'),
	});
}

// ---------- Listagens administrativas (controllers Nest) ----------

export interface AdminListParams {
	page?: number;
	limit?: number;
	status?: string;
	/** `INTERMUNICIPAL` | `INTERPROVINCIAL` — só nas corridas. */
	scope?: string;
	search?: string;
	startDate?: string;
	endDate?: string;
	/** `GET /api/admin/bookings?rideId=` — reservas de uma corrida. */
	rideId?: string;
}

export function useAdminVehicles(params: AdminListParams = {}) {
	return useQuery({
		queryKey: ['admin', 'vehicles', params],
		queryFn: async () => {
			const res = await apiClient.get<Paged<AdminVehicle>>(
				'/api/admin/vehicles',
				{ params },
			);
			return res.data;
		},
	});
}

/**
 * Uma viatura com as fotografias.
 *
 * A listagem não as traz: vinte viaturas seriam dezenas de URLs em cada
 * pedido, e o moderador só precisa delas quando abre a ficha. Sem isto,
 * aprovava-se um carro sem ver o carro.
 */
export function useAdminVehicleDetail(id: string | null, enabled = true) {
	return useQuery({
		queryKey: ['admin', 'vehicles', id],
		queryFn: async () => {
			const res = await apiClient.get<AdminVehicleDetail>(
				`/api/admin/vehicles/${id as string}`,
			);
			return res.data;
		},
		enabled: enabled && !!id,
		retry: false,
	});
}

export function useAdminRides(params: AdminListParams = {}) {
	return useQuery({
		queryKey: ['admin', 'rides', params],
		queryFn: async () => {
			const res = await apiClient.get<Paged<AdminRide>>(
				'/api/admin/rides',
				{
					params,
				},
			);
			return res.data;
		},
	});
}

/** Ficha de uma corrida, incluindo reservas e contactos completos. */
export function useAdminRideDetail(id: string | undefined) {
	return useQuery({
		queryKey: ['admin', 'rides', 'detail', id],
		queryFn: async () => {
			const res = await apiClient.get<AdminRideDetail>(
				`/api/admin/rides/${id}`,
			);
			return res.data;
		},
		enabled: Boolean(id),
		retry: false,
	});
}

export function useAdminBookings(params: AdminListParams = {}) {
	return useQuery({
		queryKey: ['admin', 'bookings', params],
		queryFn: async () => {
			const res = await apiClient.get<Paged<AdminBooking>>(
				'/api/admin/bookings',
				{ params },
			);
			return res.data;
		},
	});
}

// ---------- KYC ----------

export type KycKind = 'driver' | 'passenger';

/**
 * `GET /api/kyc/driver` e `GET /api/kyc/passenger`.
 *
 * Paginado, com o envelope `{rows,total,page,limit}` que o resto das
 * listagens do painel já usava. A versão anterior tratava a resposta como um
 * array e filtrava com `?.length` — e `length` é `undefined` num envelope, por
 * isso a fila mostrava-se sempre vazia sem qualquer erro.
 *
 * A fila identifica cada pedido pela conta (`user.name`/`surname`) e traz a
 * data de submissão. O que se revê são as fotografias dos documentos, que
 * vivem em `media`; não há nome nem número de BI escritos à mão. A paginação é
 * o que impede que um pedido traga a fila inteira num só `GET`.
 */
export function useKycRequests(kind: KycKind, status?: string, page = 1) {
	return useQuery({
		queryKey: ['kyc', kind, status, page],
		queryFn: async () => {
			const res = await apiClient.get<Paged<KycRequest>>(
				`/api/kyc/${kind}`,
				{ params: { status, page, limit: 20 } },
			);
			return res.data;
		},
	});
}

/**
 * O pedido completo, com os documentos.
 *
 * Endpoint separado da fila de propósito: as URLs assinadas dos BIs e das
 * selfies expiram em 15 minutos, e não há razão para as emitir para vinte
 * linhas que ninguém abriu. `enabled` deixa o modal pedir só quando abre.
 */
export function useKycDetail(kind: KycKind, id: string | null, enabled = true) {
	return useQuery({
		queryKey: ['kyc', kind, 'detail', id],
		queryFn: async () => {
			const res = await apiClient.get<KycDetail>(
				`/api/kyc/${kind}/${id as string}`,
			);
			return res.data;
		},
		enabled: enabled && !!id,
		retry: false,
	});
}

/**
 * Aprova ou recusa um pedido de KYC.
 *
 * O motivo é obrigatório numa recusa — o backend rejeita o pedido sem ele, e é
 * a informação que a pessoa precisa para corrigir o documento.
 */
export function useReviewKyc() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			kind: KycKind;
			id: string;
			decision: 'APPROVED' | 'REJECTED';
			reason?: string;
		}) => {
			const res = await apiClient.patch(
				`/api/kyc/${input.kind}/${input.id}/review`,
				{ decision: input.decision, reason: input.reason },
			);
			return res.data;
		},
		onSuccess: (_data, input) => {
			queryClient.invalidateQueries({ queryKey: ['kyc'] });
			queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
			queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
			toast.success(
				input.decision === 'APPROVED'
					? 'Pedido aprovado'
					: 'Pedido recusado',
			);
		},
		onError: () => toast.error('Não foi possível registar a decisão.'),
	});
}

// ---------- Viaturas ----------

export function useReviewVehicle() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (input: {
			id: string;
			decision: 'APPROVED' | 'REJECTED';
		}) => {
			const res = await apiClient.patch(
				`/api/vehicles/${input.id}/review`,
				{ decision: input.decision },
			);
			return res.data;
		},
		onSuccess: (_data, input) => {
			queryClient.invalidateQueries({ queryKey: ['admin', 'vehicles'] });
			queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
			queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
			toast.success(
				input.decision === 'APPROVED'
					? 'Viatura aprovada'
					: 'Viatura recusada',
			);
		},
		onError: () => toast.error('Não foi possível registar a decisão.'),
	});
}

// ---------- Auditoria ----------

export interface AuditLogParams extends AdminListParams {
	action?: string;
	entityType?: string;
	actorId?: string;
	entityId?: string;
}

/** `GET /api/admin/audit-logs`, envelope Nest. */
export function useAuditLogs(params: AuditLogParams = {}) {
	return useQuery({
		queryKey: ['audit-logs', params],
		queryFn: async () => {
			const res = await apiClient.get<Paged<AuditEntry>>(
				'/api/admin/audit-logs',
				{ params },
			);
			return res.data;
		},
	});
}

/**
 * Acções que existem de facto na base.
 *
 * Vem do servidor em vez de uma lista local: mostrar acções que nunca
 * aconteceram dá um filtro com opções que devolvem sempre zero.
 */
export function useAuditActions() {
	return useQuery({
		queryKey: ['audit-logs', 'actions'],
		queryFn: async () => {
			const res = await apiClient.get<{ actions: string[] }>(
				'/api/admin/audit-logs/actions',
			);
			return res.data.actions;
		},
		staleTime: 5 * 60 * 1000,
	});
}

// ---------- Dashboard ----------

export function useAdminStats(params: { days?: number } = {}) {
	return useQuery({
		queryKey: ['admin', 'stats', params],
		queryFn: async () => {
			const res = await apiClient.get<AdminStats>('/api/admin/stats', {
				params,
			});
			return res.data;
		},
	});
}

// ---------- WhatsApp ----------

/** Envia a mensagem de teste. Só o ADMIN tem `whatsapp:['test']`. */
export function useSendWhatsAppTest() {
	return useMutation({
		mutationFn: async (input: { to: string; text?: string }) => {
			const res = await apiClient.post('/api/whatsapp/test', input);
			return res.data as { to: string };
		},
		onSuccess: (data) => {
			toast.success(`Mensagem enfileirada para ${data.to}`);
		},
		onError: () => toast.error(messages.fallback),
	});
}
