import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { KycDetailModal } from './KycDetailModal';
import { useKycRequests, type KycKind } from '../../hooks/queries/useAdmin';
import { VERIFICATION_STATUS_LABELS, enumLabel } from '../../lib/enums';
import { fmtDate } from '../../lib/format';
import { useCan } from '../../lib/permissions';
import type { KycRequest } from '../../types/admin';
import { CheckCircle2, ClipboardCheck } from 'lucide-react';

const TABS: { kind: KycKind; label: string }[] = [
	{ kind: 'driver', label: 'Motorista' },
	{ kind: 'passenger', label: 'Passageiro' },
];

const STATUS_OPTIONS = [
	{ value: '', label: 'Todos os estados' },
	{ value: 'PENDING', label: VERIFICATION_STATUS_LABELS.PENDING },
	{ value: 'VERIFIED', label: VERIFICATION_STATUS_LABELS.VERIFIED },
	{ value: 'REJECTED', label: VERIFICATION_STATUS_LABELS.REJECTED },
	{ value: 'NOT_SUBMITTED', label: VERIFICATION_STATUS_LABELS.NOT_SUBMITTED },
];

/**
 * O nome que identifica o pedido vem da conta, não do formulário de KYC.
 *
 * Pode estar vazio: o registo é telefone-primeiro e aceita nome e apelido em
 * branco. Nesse caso mostra-se um rótulo neutro e o id da conta, que é o que
 * ainda distingue dois pedidos sem nome.
 */
function accountName(request: KycRequest): string {
	const name = [request.user?.name, request.user?.surname]
		.filter(Boolean)
		.join(' ')
		.trim();
	return name || 'Conta sem nome';
}

/**
 * Fila de revisão de KYC.
 *
 * Clicar na linha abre a ficha com os documentos; os botões da coluna
 * «Decisão» abrem a mesma ficha com a decisão já escolhida. Aprovar e recusar
 * só aparece a quem tem `kyc:['review','approve','reject']` — o ADMIN e o
 * MODERATOR. O SUPPORT continua a ver a fila, mas os documentos exigem
 * `kyc:review` e não lhe pertencem.
 */
export function KycList() {
	const [kind, setKind] = useState<KycKind>('driver');
	const [status, setStatus] = useState<string>('PENDING');
	const [page, setPage] = useState(1);
	const [selection, setSelection] = useState<{
		request: KycRequest;
		decision: 'APPROVED' | 'REJECTED' | null;
	} | null>(null);
	const canReview = useCan('moderate');

	const { data, isLoading, isError, error, refetch } = useKycRequests(
		kind,
		status || undefined,
		page,
	);
	const requests = data?.rows ?? [];
	const total = data?.total ?? 0;

	const changeKind = (next: KycKind) => {
		setKind(next);
		setPage(1);
		setSelection(null);
	};

	const columns: Column<KycRequest>[] = [
		{
			key: 'user',
			label: 'Conta',
			render: (r) => (
				<div>
					<div className="font-sansBold text-body-small">
						{accountName(r)}
					</div>
					<div className="text-xs text-text-secondary">
						{r.userId}
					</div>
				</div>
			),
		},
		{
			key: 'status',
			label: 'Estado',
			render: (r) => (
				<StatusBadge
					status={r.status}
					label={enumLabel(VERIFICATION_STATUS_LABELS, r.status)}
				/>
			),
		},
		{
			key: 'submissionDate',
			label: 'Submetido',
			render: (r) => fmtDate(r.submissionDate ?? r.createdAt),
		},
		...(canReview
			? [
					{
						key: 'actions',
						label: 'Decisão',
						render: (r: KycRequest) =>
							r.status === 'PENDING' ? (
								<div className="flex gap-2">
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											setSelection({
												request: r,
												decision: 'APPROVED',
											});
										}}
										className="min-h-[32px] rounded-md bg-success px-3 py-1.5 text-xs font-sansBold text-white hover:opacity-90"
									>
										Aprovar
									</button>
									<button
										type="button"
										onClick={(event) => {
											event.stopPropagation();
											setSelection({
												request: r,
												decision: 'REJECTED',
											});
										}}
										className="min-h-[32px] rounded-md border px-3 py-1.5 text-xs font-sansBold text-error hover:bg-error/5"
									>
										Recusar
									</button>
								</div>
							) : (
								<span className="text-xs text-text-secondary">
									—
								</span>
							),
					} as Column<KycRequest>,
				]
			: []),
	];

	return (
		<div>
			<PageHeader
				title="Verificação de identidade"
				subtitle="Documentos de identidade enviados por passageiros e motoristas"
				icon={ClipboardCheck}
			/>

			<div className="mb-4 flex gap-2">
				{TABS.map((tab) => (
					<button
						key={tab.kind}
						type="button"
						onClick={() => changeKind(tab.kind)}
						className={`min-h-[36px] rounded-full px-4 py-1.5 text-sm font-sansMedium transition-colors ${
							kind === tab.kind
								? 'bg-primary text-white'
								: 'bg-surface text-text-secondary border hover:bg-background'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<FilterBar
				selectFilters={[
					{ key: 'status', label: 'Estado', options: STATUS_OPTIONS },
				]}
				filterValues={{ status }}
				onFilterChange={(_key, value) => {
					setStatus(value ?? '');
					setPage(1);
				}}
			/>

			<div className="mt-4">
				{!isLoading && !isError && requests.length === 0 ? (
					<EmptyState
						icon={CheckCircle2}
						title="Nada para rever"
						copy="Não há pedidos com este estado."
					/>
				) : (
					<DataTable
						columns={columns}
						data={requests}
						loading={isLoading}
						error={error}
						onRetry={() => refetch()}
						onRowClick={(request) =>
							setSelection({ request, decision: null })
						}
						emptyMessage="Não há pedidos com este estado."
					/>
				)}
			</div>

			<Pagination
				page={page}
				limit={20}
				total={total}
				onPageChange={setPage}
			/>

			<KycDetailModal
				open={selection !== null}
				kind={kind}
				request={selection?.request ?? null}
				initialDecision={selection?.decision ?? null}
				onClose={() => setSelection(null)}
			/>
		</div>
	);
}
