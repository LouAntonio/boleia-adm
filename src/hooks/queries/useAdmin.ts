import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '../../lib/axios';
import type {
	AdminBooking,
	AdminRide,
	AdminStats,
	AdminVehicle,
	AuditEntry,
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
 * `GET /api/auth/admin/list-users`
 *
 * Usa paginação por `offset` (não por página): é o que o plugin expõe. O
 * `Pagination` do kit de UI é por página, por isso a conversão acontece aqui e
 * não na página.
 */
export function useUsers(params: UserListParams = {}) {
	const limit = params.limit ?? 20;
	const page = params.page ?? 1;

	return useQuery({
		queryKey: ['users', params],
		queryFn: async () => {
			const res = await apiClient.get<UserListResponse>(
				'/api/auth/admin/list-users',
				{
					params: {
						limit,
						offset: (page - 1) * limit,
						searchValue: params.search || undefined,
						searchField: params.searchField ?? 'name',
						filterField: params.role ? 'role' : undefined,
						filterValue: params.role || undefined,
						sortDirection: params.sortDirection,
					},
				},
			);
			return res.data;
		},
	});
}

export function useUser(id: string | undefined) {
	return useQuery({
		queryKey: ['users', id],
		queryFn: async () => {
			const res = await apiClient.get('/api/auth/admin/get-user', {
				params: { id },
			});
			return res.data;
		},
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
		mutationFn: async (input: { userId: string; role: string }) => {
			const res = await apiClient.post('/api/auth/admin/set-role', {
				userId: input.userId,
				role: input.role,
			});
			return res.data;
		},
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
		mutationFn: async (input: {
			userId: string;
			banReason?: string;
			banExpiresIn?: number;
		}) => {
			const res = await apiClient.post('/api/auth/admin/ban-user', {
				userId: input.userId,
				banReason: input.banReason,
				banExpiresIn: input.banExpiresIn,
			});
			return res.data;
		},
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
		mutationFn: async (userId: string) => {
			const res = await apiClient.post('/api/auth/admin/unban-user', {
				userId,
			});
			return res.data;
		},
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
			return res.data as Paged<{
				id: string;
				ipAddress: string | null;
				userAgent: string | null;
				lastActiveAt?: string | null;
				createdAt: string;
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
	search?: string;
	startDate?: string;
	endDate?: string;
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

/** `GET /api/kyc/driver` e `GET /api/kyc/passenger`. */
export function useKycRequests(kind: KycKind, status?: string) {
	return useQuery({
		queryKey: ['kyc', kind, status],
		queryFn: async () => {
			const res = await apiClient.get<KycRequest[]>(`/api/kyc/${kind}`, {
				params: { status },
			});
			return res.data;
		},
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
