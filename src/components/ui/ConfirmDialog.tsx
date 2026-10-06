import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
	open: boolean;
	onConfirm: () => void;
	onCancel: () => void;
	title: string;
	message: string;
	confirmLabel?: string;
	loading?: boolean;
	variant?: 'danger' | 'default';
}

export function ConfirmDialog({
	open,
	onConfirm,
	onCancel,
	title,
	message,
	confirmLabel = 'Confirmar',
	loading,
	variant = 'default',
}: ConfirmDialogProps) {
	if (!open) return null;

	const styles =
		variant === 'danger'
			? {
					button: 'bg-error text-white hover:bg-error/90',
					icon: 'text-error bg-error/10',
				}
			: {
					button: 'bg-primary text-white hover:bg-primary-hover',
					icon: 'text-primary bg-primary/10',
				};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
			onClick={onCancel}
		>
			<div
				className="w-full max-w-sm animate-fade-in rounded-xl border bg-surface p-6 shadow-elevated"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-start gap-4">
					<div
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.icon}`}
					>
						{variant === 'danger' ? (
							<AlertTriangle size={20} />
						) : (
							<AlertTriangle size={20} />
						)}
					</div>
					<div className="flex-1">
						<h2 className="text-lg font-semibold font-display text-text">
							{title}
						</h2>
						<p className="mt-1 text-sm text-text-secondary">
							{message}
						</p>
					</div>
					<button
						onClick={onCancel}
						className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text"
					>
						<X size={18} />
					</button>
				</div>
				<div className="flex justify-end gap-2">
					<button
						onClick={onCancel}
						className="rounded-lg border bg-background px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-border/50"
					>
						Cancelar
					</button>
					<button
						onClick={onConfirm}
						disabled={loading}
						className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${styles.button}`}
					>
						{loading ? 'A processar...' : confirmLabel}
					</button>
				</div>
			</div>
		</div>
	);
}
