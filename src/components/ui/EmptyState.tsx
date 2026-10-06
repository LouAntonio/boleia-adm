import type { LucideIcon } from 'lucide-react';
import { SearchX } from 'lucide-react';

interface EmptyStateProps {
	icon?: LucideIcon;
	title: string;
	copy?: string;
	actionTitle?: string;
	onAction?: () => void;
}

/**
 * Estado vazio de uma lista ou de uma página.
 *
 * Ter isto explícito evita a alternativa habitual — uma tabela a mostrar
 * "Nenhum registo encontrado." em linhas cinzentas — que não diz ao utilizador
 * se não há nada, se ainda está a carregar, ou se o filtro está errado.
 */
export function EmptyState({
	icon: Icon = SearchX,
	title,
	copy,
	actionTitle,
	onAction,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed bg-surface px-6 py-14 text-center">
			<div className="mb-3 rounded-full bg-background p-3">
				<Icon size={22} className="text-text-secondary" />
			</div>
			<h3 className="text-label font-sansBold text-text">{title}</h3>
			{copy ? (
				<p className="mt-1 max-w-sm text-body-small text-text-secondary">
					{copy}
				</p>
			) : null}
			{actionTitle && onAction ? (
				<button
					type="button"
					onClick={onAction}
					className="mt-5 min-h-[38px] rounded-lg bg-primary px-4 py-2 text-sm font-sansBold text-white transition-colors hover:bg-primary-hover"
				>
					{actionTitle}
				</button>
			) : null}
		</div>
	);
}
