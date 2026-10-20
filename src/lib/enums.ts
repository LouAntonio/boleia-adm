/**
 * Rótulos dos enums do backend.
 *
 * As chaves são exactamente os valores dos enums Prisma em
 * `back/prisma/schema.prisma`. Se o servidor introduzir um estado novo, o
 * `enumLabel` devolve a própria chave em vez de `undefined` — o painel mostra
 * algo legível em vez de um buraco.
 */

export const USER_ROLE_LABELS: Record<string, string> = {
	USER: 'Utilizador',
	DRIVER: 'Motorista',
	MODERATOR: 'Moderador',
	SUPPORT: 'Suporte',
	ADMIN: 'Administrador',
};

/**
 * Papéis que podem entrar no painel.
 *
 * Não é o mesmo que `USER_ROLE_LABELS`: `USER` e `DRIVER` são os utilizadores
 * finais da app e não têm porque ver um ecrã de administração.
 */
export const ADMIN_ROLES = ['ADMIN', 'MODERATOR', 'SUPPORT'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(
	role: string | null | undefined,
): role is AdminRole {
	return ADMIN_ROLES.includes(role as AdminRole);
}

export const RIDE_STATUS_LABELS: Record<string, string> = {
	SCHEDULED: 'Agendada',
	IN_PROGRESS: 'Em curso',
	COMPLETED: 'Concluída',
	CANCELLED: 'Cancelada',
};

/** `RideStopKind` no backend. */
export const RIDE_STOP_KIND_LABELS: Record<string, string> = {
	ORIGIN: 'Origem',
	INTERMEDIATE: 'Paragem',
	DESTINATION: 'Destino',
};

export const BOOKING_STATUS_LABELS: Record<string, string> = {
	REQUESTED: 'Pedido',
	CONFIRMED: 'Confirmada',
	IN_PROGRESS: 'Em viagem',
	COMPLETED: 'Concluída',
	REJECTED: 'Recusada',
	CANCELLED: 'Cancelada',
	EXPIRED: 'Expirada',
};

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
	NOT_SUBMITTED: 'Por submeter',
	PENDING: 'Pendente',
	VERIFIED: 'Verificado',
	REJECTED: 'Recusado',
};

/** `PaymentKind` no backend. A v1 da app só usa `CASH`. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
	WALLET: 'Carteira',
	CASH: 'Dinheiro',
	MULTICAIXA: 'Multicaixa',
};

/** Estados possíveis de uma review de KYC ou de viatura. */
export const REVIEW_DECISION_LABELS: Record<string, string> = {
	APPROVED: 'Aprovar',
	REJECTED: 'Recusar',
};

/**
 * Rótulos das acções auditadas.
 *
 * Só cobrem as acções que o backend emite hoje (`AUDIT_ACTION` em
 * `back/src/audit/audit.constants.ts`). O backend também expõe
 * `GET /api/admin/audit-logs/actions` com o que existe de facto na base, e é
 * esse que alimenta o filtro — esta lista é só para os casos mais correntes,
 * com `enumLabel` a servir de rede de segurança para o resto.
 */
export const AUDIT_ACTION_LABELS: Record<string, string> = {
	KYC_SUBMITTED: 'KYC submetido',
	KYC_APPROVED: 'KYC aprovado',
	KYC_REJECTED: 'KYC recusado',
	VEHICLE_SUBMITTED: 'Viatura submetida',
	VEHICLE_APPROVED: 'Viatura aprovada',
	VEHICLE_REJECTED: 'Viatura recusada',
	VEHICLE_UPDATED: 'Viatura actualizada',
	VEHICLE_DELETED: 'Viatura eliminada',
	USER_CREATED: 'Utilizador criado',
	USER_UPDATED: 'Utilizador actualizado',
	USER_ROLE_CHANGED: 'Role alterado',
	USER_BANNED: 'Utilizador banido',
	USER_UNBANNED: 'Banimento levantado',
	USER_DELETED: 'Utilizador eliminado',
	USER_PASSWORD_RESET: 'Palavra-passe reposta',
	USER_IMPERSONATED: 'Utilizador impersonado',
	SESSION_REVOKED: 'Sessão revogada',
	SESSIONS_REVOKED_ALL: 'Todas as sessões revogadas',
	MEDIA_CLEANUP: 'Limpeza de media',
	RIDE_CANCELLED_BY_ADMIN: 'Corrida cancelada por admin',
	BOOKING_CANCELLED_BY_ADMIN: 'Reserva cancelada por admin',
	WHATSAPP_TEST_SENT: 'WhatsApp de teste enviado',
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
	DRIVER_KYC: 'KYC motorista',
	PASSENGER_KYC: 'KYC passageiro',
	VEHICLE: 'Viatura',
	USER: 'Utilizador',
	SESSION: 'Sessão',
	MEDIA: 'Media',
	RIDE: 'Corrida',
	BOOKING: 'Reserva',
	WHATSAPP: 'WhatsApp',
};

export function enumLabel(
	map: Record<string, string>,
	key: string | null | undefined,
): string {
	if (!key) return '—';
	return map[key] ?? key;
}
