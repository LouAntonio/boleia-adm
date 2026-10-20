type StatusVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';

const variantMap: Record<StatusVariant, string> = {
	success: 'bg-success/10 text-success border-success/20',
	warning: 'bg-warning/10 text-warning border-warning/20',
	error: 'bg-error/10 text-error border-error/20',
	info: 'bg-primary/10 text-primary border-primary/20',
	neutral:
		'bg-text-secondary/10 text-text-secondary border-text-secondary/20',
};

const dotMap: Record<StatusVariant, string> = {
	success: 'bg-success',
	warning: 'bg-warning',
	error: 'bg-error',
	info: 'bg-primary',
	neutral: 'bg-text-secondary',
};

const complianceMap: Record<string, StatusVariant> = {
	APPROVED: 'success',
	VERIFIED: 'success',
	PENDING: 'warning',
	REJECTED: 'error',
	NOT_SUBMITTED: 'neutral',
	SUSPENDED: 'error',
	ACTIVE: 'success',
	BANNED: 'error',
	ONLINE: 'success',
	OFFLINE: 'neutral',
	BUSY: 'warning',
	COMPLETED: 'success',
	CANCELLED: 'error',
	REQUESTED: 'info',
	ACCEPTED: 'info',
	STARTED: 'warning',
	PAID: 'success',
	FAILED: 'error',
	REFUNDED: 'info',
	DELIVERED: 'success',
};

interface StatusBadgeProps {
	status: string;
	variant?: StatusVariant;
	label?: string;
}

export function StatusBadge({ status, variant, label }: StatusBadgeProps) {
	const v = variant ?? complianceMap[status] ?? 'neutral';
	return (
		<span
			className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${variantMap[v]}`}
		>
			<span className={`h-1.5 w-1.5 rounded-full ${dotMap[v]}`} />
			{label ?? status.replace(/_/g, ' ')}
		</span>
	);
}
