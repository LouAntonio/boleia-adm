import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import {
	useKycRequests,
	useReviewKyc,
	type KycKind,
} from '../../hooks/queries/useAdmin';
import { VERIFICATION_STATUS_LABELS, enumLabel } from '../../lib/enums';
import { useCan } from '../../lib/permissions';
import type { KycRequest } from '../../types/admin';
import { CheckCircle2, ClipboardCheck, Loader2 } from 'lucide-react';

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

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString('pt-PT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

/**
 * Fila de revisão de KYC.
 *
 * Aprovar e recusar só aparece a quem tem `kyc:['approve','reject']` — o
 * ADMIN e o MODERATOR. O SUPPORT vê a fila em leitura, que é tudo o que os
 * seus papéis permitem.
 */
export function KycList() {
	const [kind, setKind] = useState<KycKind>('driver');
	const [status, setStatus] = useState<string>('PENDING');
	const [deciding, setDeciding] = useState<{
		request: KycRequest;
		decision: 'APPROVED' | 'REJECTED';
	} | null>(null);
	const [reason, setReason] = useState('');
	const canReview = useCan('moderate');
	const review = useReviewKyc();

	const {
		data: page,
		isLoading,
		isError,
		error,
		refetch,
	} = useKycRequests(kind, status || undefined);
	const requests = page?.rows ?? [];

	const submit = () => {
		if (!deciding) return;
		// A recusa sem motivo não chega ao backend, que exige. Bloquear aqui
		// evita um erro de validação depois de o modal já estar fechado.
		if (deciding.decision === 'REJECTED' && !reason.trim()) return;
		review.mutate(
			{
				kind,
				id: deciding.request.id,
				decision: deciding.decision,
				reason: reason.trim() || undefined,
			},
			{
				onSuccess: () => {
					setDeciding(null);
					setReason('');
				},
			},
		);
	};

	const columns: Column<KycRequest>[] = [
		{
			key: 'fullName',
			label: 'Nome',
			render: (r) => (
				<span className="font-sansBold text-body-small">
					{r.fullName}
				</span>
			),
		},
		{ key: 'biNumber', label: 'BI' },
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
			render: (r) => fmtDate(r.submissionDate),
		},
		...(canReview
			? [
					{
						key: 'actions',
						label: 'Decisão',
						render: (r: KycRequest) => (
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => {
										setDeciding({
											request: r,
											decision: 'APPROVED',
										});
										setReason('');
									}}
									className="min-h-[32px] rounded-md bg-success px-3 py-1.5 text-xs font-sansBold text-white hover:opacity-90"
								>
									Aprovar
								</button>
								<button
									type="button"
									onClick={() => {
										setDeciding({
											request: r,
											decision: 'REJECTED',
										});
										setReason('');
									}}
									className="min-h-[32px] rounded-md border px-3 py-1.5 text-xs font-sansBold text-error hover:bg-error/5"
								>
									Recusar
								</button>
							</div>
						),
					} as Column<KycRequest>,
				]
			: []),
	];

	return (
		<div>
			<PageHeader
				title="Verificação de identidade"
				subtitle="Documentos de identidade enviados por Passageiros e motoristas"
				icon={ClipboardCheck}
			/>

			<div className="mb-4 flex gap-2">
				{TABS.map((tab) => (
					<button
						key={tab.kind}
						type="button"
						onClick={() => setKind(tab.kind)}
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
				onFilterChange={(_key, value) => setStatus(value ?? '')}
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
						emptyMessage="Não há pedidos com este estado."
					/>
				)}
			</div>

			<Modal
				open={deciding !== null}
				onClose={() => setDeciding(null)}
				title={
					deciding?.decision === 'APPROVED'
						? 'Aprovar pedido'
						: 'Recusar pedido'
				}
			>
				{deciding ? (
					<div className="space-y-4">
						<div className="rounded-lg bg-background p-3 text-body-small">
							<div className="font-sansBold">
								{deciding.request.fullName}
							</div>
							<div className="text-text-secondary">
								BI {deciding.request.biNumber}
							</div>
						</div>

						{deciding.decision === 'REJECTED' ? (
							<div className="space-y-1.5">
								<label className="block text-sm font-medium text-text">
									Motivo da recusa
								</label>
								<textarea
									value={reason}
									onChange={(e) => setReason(e.target.value)}
									rows={3}
									placeholder="Ex.: fotografia do BI ilegível"
									className="w-full rounded-lg border bg-surface p-3 text-sm text-text outline-none focus:border-primary"
								/>
								<p className="text-xs text-text-secondary">
									A pessoa vê este motivo. É o que lhe permite
									corrigir e voltar a submeter.
								</p>
							</div>
						) : (
							<p className="text-body-small text-text-secondary">
								Ao aprovar, o {deciding.request.fullName} passa
								a poder publicar corridas
								{kind === 'driver'
									? ''
									: ' e a reservar lugares'}
								.
							</p>
						)}

						<button
							type="button"
							onClick={submit}
							disabled={
								review.isPending ||
								(deciding.decision === 'REJECTED' &&
									!reason.trim())
							}
							className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-sansBold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
						>
							{review.isPending ? (
								<Loader2 size={16} className="animate-spin" />
							) : null}
							{deciding.decision === 'APPROVED'
								? 'Confirmar aprovação'
								: 'Confirmar recusa'}
						</button>
					</div>
				) : null}
			</Modal>
		</div>
	);
}
