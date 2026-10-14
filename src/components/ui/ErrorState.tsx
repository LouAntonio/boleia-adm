import { AlertTriangle, RotateCw } from 'lucide-react';
import { apiErrorMessage } from '../../lib/axios';

/**
 * Falha de um pedido, com botão para repetir.
 *
 * Existe por causa de um padrão que o painel tinha em cinco páginas: a query
 * expunha `isLoading` e `data`, e nada mais. Uma falha de rede ou um 403
 * caíam no ramo de estado vazio — um `SUPPORT` a escrever `/kyc` à mão via
 * "Nada para rever", e um 500 de `/api/admin/stats` deixava skeletons
 * eternos. Em ambos os casos o operador concluía que não havia trabalho, ou
 * que a página estava a carregar para sempre, quando o que havia era um erro
 * que ele podia repetir.
 *
 * `apiErrorMessage` já vivia em `lib/axios.ts` desde o início e nunca foi
 * usado em lado nenhum. Está aqui agora.
 */
export function ErrorState({
	error,
	onRetry,
	context,
}: {
	error: unknown;
	onRetry: () => void;
	/** O que se estava a tentar carregar, para a mensagem fazer sentido. */
	context?: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-error/30 bg-error/5 px-6 py-12 text-center">
			<div className="mb-3 rounded-full bg-error/10 p-3">
				<AlertTriangle size={22} className="text-error" />
			</div>
			<h3 className="text-label font-sansBold text-text">
				Não foi possível carregar{context ? ` ${context}` : ''}
			</h3>
			<p className="mt-1 max-w-md text-body-small text-text-secondary">
				{apiErrorMessage(error, 'O servidor não respondeu.')}
			</p>
			<button
				type="button"
				onClick={onRetry}
				className="mt-5 inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-sansBold text-text transition-colors hover:bg-background"
			>
				<RotateCw size={15} aria-hidden="true" />
				Tentar de novo
			</button>
		</div>
	);
}
