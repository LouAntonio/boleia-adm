export const USER_ROLE_LABELS: Record<string, string> = {
	USER: 'Utilizador',
	SUPPORT: 'Suporte',
	ADMIN: 'Administrador',
};

export const PLAN_STATUS_LABELS: Record<string, string> = {
	ACTIVE: 'Activo',
	INACTIVE: 'Inactivo',
	ARCHIVED: 'Arquivado',
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
	ACTIVE: 'Activa',
	EXPIRED: 'Expirada',
	CANCELED: 'Cancelada',
	PAST_DUE: 'Vencida',
};

export const TRANSCRIPTION_STATUS_LABELS: Record<string, string> = {
	PENDING: 'Pendente',
	PROCESSING: 'Processando',
	DONE: 'Concluído',
	FAILED: 'Falhou',
};

export const TRANSCRIPTION_TYPE_LABELS: Record<string, string> = {
	REALTIME: 'Tempo Real',
	UPLOAD: 'Upload',
};

export const LANGUAGE_LABELS: Record<string, string> = {
	PT: 'Português',
	EN: 'Inglês',
	FR: 'Francês',
};

export const AI_STATUS_LABELS: Record<string, string> = {
	NOT_STARTED: 'Não Iniciado',
	PROCESSING: 'Processando',
	COMPLETED: 'Concluído',
	FAILED: 'Falhou',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
	PENDING: 'Pendente',
	SUCCESS: 'Sucesso',
	FAILED: 'Falhou',
	EXPIRED: 'Expirado',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
	PAYPAY_WALLET: 'PayPay Wallet',
	BANK_TRANSFER: 'Transferência Bancária',
	KWIK: 'KWiK QR Code',
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
	PAYMENT: 'Pagamento',
	REFUND: 'Reembolso',
	TRANSFER: 'Transferência',
};

export function enumLabel(
	map: Record<string, string>,
	key: string | null | undefined,
): string {
	if (!key) return '—';
	return map[key] ?? key;
}
