import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck, XCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState } from '../../components/ui/ErrorState';
import {
	useKycDetail,
	useReviewKyc,
	type KycKind,
} from '../../hooks/queries/useAdmin';
import { VERIFICATION_STATUS_LABELS, enumLabel } from '../../lib/enums';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { useCan } from '../../lib/permissions';
import type { KycRequest } from '../../types/admin';

type Decision = 'APPROVED' | 'REJECTED';

interface KycDetailModalProps {
	open: boolean;
	kind: KycKind;
	request: KycRequest | null;
	/** Decisão pré-escolhida quando o modal abre pelo botão da linha. */
	initialDecision?: Decision | null;
	onClose: () => void;
}

function displayName(
	name: string | null | undefined,
	surname: string | null | undefined,
): string {
	return [name, surname].filter(Boolean).join(' ').trim() || 'Conta sem nome';
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<div>
			<p className="text-xs uppercase text-text-secondary">{label}</p>
			<div className="mt-0.5 text-sm text-text">{value}</div>
		</div>
	);
}

/**
 * Ficha de revisão de KYC.
 *
 * A fila só mostra nome e estado; aprovar sem ver o BI era aprovar um pedido
 * em que o documento nunca chegou a aparecer no ecrã. Aqui os documentos
 * vêm do endpoint de detalhe, com URLs assinadas de 15 minutos, e a decisão
 * fica no mesmo sítio em que se lê o documento.
 */
export function KycDetailModal({
	open,
	kind,
	request,
	initialDecision = null,
	onClose,
}: KycDetailModalProps) {
	const canReview = useCan('moderate');
	const detail = useKycDetail(kind, request?.id ?? null, open);
	const review = useReviewKyc();
	const [decision, setDecision] = useState<Decision | null>(initialDecision);
	const [reason, setReason] = useState('');

	useEffect(() => {
		setDecision(initialDecision);
		setReason('');
	}, [request?.id, initialDecision]);

	const data = detail.data;
	const status = data?.status ?? request?.status;
	const name = data
		? displayName(data.account.name, data.account.surname)
		: displayName(request?.user?.name, request?.user?.surname);
	const pending = status === 'PENDING';

	const submit = () => {
		if (!request || !decision) return;
		if (decision === 'REJECTED' && !reason.trim()) return;
		review.mutate(
			{
				kind,
				id: request.id,
				decision,
				reason: reason.trim() || undefined,
			},
			{ onSuccess: () => onClose() },
		);
	};

	return (
		<Modal
			open={open}
			onClose={onClose}
			title="Revisão de identidade"
			size="xl"
		>
			{detail.isLoading ? (
				<div className="space-y-4">
					<div className="h-20 animate-skeleton rounded-lg bg-border/40" />
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{Array.from({ length: 6 }).map((_, index) => (
							<div
								key={index}
								className="h-32 animate-skeleton rounded-lg bg-border/40"
							/>
						))}
					</div>
				</div>
			) : detail.isError ? (
				<ErrorState
					error={detail.error}
					context="os documentos deste pedido"
					onRetry={() => detail.refetch()}
				/>
			) : data ? (
				<div className="space-y-6">
					<div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-background p-4">
						<div className="min-w-0">
							<div className="flex flex-wrap items-center gap-2">
								<h3 className="text-lg font-sansBold text-text">
									{name}
								</h3>
								<StatusBadge
									status={data.status}
									label={enumLabel(
										VERIFICATION_STATUS_LABELS,
										data.status,
									)}
								/>
							</div>
							<p className="mt-1 text-sm text-text-secondary">
								{data.account.phone ?? 'Sem telefone'} ·{' '}
								{data.account.email}
							</p>
							<p className="mt-0.5 font-mono text-xs text-text-secondary">
								{data.userId}
							</p>
						</div>
						<div className="rounded-md bg-surface px-3 py-2 text-right">
							<p className="text-xs uppercase text-text-secondary">
								Pedido
							</p>
							<p className="text-sm font-sansBold">
								{kind === 'driver' ? 'Motorista' : 'Passageiro'}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Info
							label="Submetido"
							value={fmtDateTime(
								data.submissionDate ?? data.createdAt,
							)}
						/>
						<Info
							label="Revisto em"
							value={
								data.verifiedAt
									? fmtDateTime(data.verifiedAt)
									: '—'
							}
						/>
						<Info
							label="Conta criada"
							value={fmtDate(data.account.createdAt)}
						/>
						<Info
							label="Documentos"
							value={`${data.documents.length} ficheiro${
								data.documents.length === 1 ? '' : 's'
							}`}
						/>
					</div>

					{data.rejectionReason ? (
						<div className="rounded-lg border border-error/30 bg-error/5 p-3">
							<p className="text-xs font-sansBold text-error">
								Motivo da recusa anterior
							</p>
							<p className="mt-1 text-sm text-text">
								{data.rejectionReason}
							</p>
						</div>
					) : null}

					<section>
						<div className="mb-3 flex items-center gap-2">
							<ShieldCheck
								size={16}
								className="text-text-secondary"
							/>
							<h4 className="text-sm font-sansBold text-text">
								Documentos
							</h4>
						</div>
						<ImageGallery
							images={data.documents}
							emptyMessage="Esta submissão não tem fotografias."
						/>
						<p className="mt-2 text-xs text-text-secondary">
							As ligações expiram 15 minutos depois de abrires
							este pedido. Clica numa fotografia para a veres em
							grande.
						</p>
					</section>

					{canReview && pending ? (
						<section className="rounded-lg border p-4">
							<h4 className="text-sm font-sansBold text-text">
								Decisão
							</h4>
							<p className="mt-0.5 text-xs text-text-secondary">
								Aprovar liberta a conta para{' '}
								{kind === 'driver'
									? 'publicar corridas'
									: 'pedir boleias'}
								. Recusar exige um motivo, que a pessoa vê.
							</p>

							<div className="mt-3 flex flex-wrap gap-2">
								<button
									type="button"
									onClick={() => setDecision('APPROVED')}
									className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-sansBold transition-colors ${
										decision === 'APPROVED'
											? 'border-success bg-success text-white'
											: 'border-line text-success hover:bg-success/5'
									}`}
								>
									<CheckCircle2 size={16} />
									Aprovar
								</button>
								<button
									type="button"
									onClick={() => setDecision('REJECTED')}
									className={`inline-flex min-h-[38px] items-center gap-2 rounded-lg border px-3 py-2 text-sm font-sansBold transition-colors ${
										decision === 'REJECTED'
											? 'border-error bg-error text-white'
											: 'border-line text-error hover:bg-error/5'
									}`}
								>
									<XCircle size={16} />
									Recusar
								</button>
							</div>

							{decision === 'REJECTED' ? (
								<div className="mt-3 space-y-1.5">
									<label className="block text-sm font-medium text-text">
										Motivo da recusa
									</label>
									<textarea
										value={reason}
										onChange={(event) =>
											setReason(event.target.value)
										}
										rows={3}
										placeholder="Ex.: fotografia do BI ilegível"
										className="w-full rounded-lg border bg-surface p-3 text-sm text-text outline-none focus:border-primary"
									/>
									<p className="text-xs text-text-secondary">
										A pessoa vê este motivo. É o que lhe
										permite corrigir e voltar a submeter.
									</p>
								</div>
							) : null}

							<button
								type="button"
								onClick={submit}
								disabled={
									!decision ||
									review.isPending ||
									(decision === 'REJECTED' && !reason.trim())
								}
								className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-sansBold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
							>
								{review.isPending ? (
									<Loader2
										size={16}
										className="animate-spin"
									/>
								) : null}
								{decision === 'APPROVED'
									? 'Confirmar aprovação'
									: decision === 'REJECTED'
										? 'Confirmar recusa'
										: 'Escolhe uma decisão'}
							</button>
						</section>
					) : (
						<p className="rounded-lg bg-background p-3 text-xs text-text-secondary">
							{pending
								? 'Só quem revê KYC pode decidir sobre este pedido.'
								: 'Este pedido já foi revisto e não volta a ser decidido.'}
						</p>
					)}
				</div>
			) : null}
		</Modal>
	);
}
