import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ErrorState } from '../../components/ui/ErrorState';
import {
	useAdminVehicleDetail,
	useReviewVehicle,
} from '../../hooks/queries/useAdmin';
import { VERIFICATION_STATUS_LABELS, enumLabel } from '../../lib/enums';
import { fmtDate, fmtDateTime } from '../../lib/format';
import { useCan } from '../../lib/permissions';

type Decision = 'APPROVED' | 'REJECTED';

interface VehicleDetailModalProps {
	open: boolean;
	vehicleId: string | null;
	initialDecision?: Decision | null;
	onClose: () => void;
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
 * Ficha de revisão de uma viatura.
 *
 * O botão «Aprovar» existia sem mostrar o carro: a listagem não traz
 * fotografias e não havia detalhe. Aqui aparecem as fotos, o proprietário e o
 * histórico de viagens antes de qualquer decisão.
 */
export function VehicleDetailModal({
	open,
	vehicleId,
	initialDecision = null,
	onClose,
}: VehicleDetailModalProps) {
	const canReview = useCan('moderate');
	const detail = useAdminVehicleDetail(vehicleId, open);
	const review = useReviewVehicle();
	const [decision, setDecision] = useState<Decision | null>(initialDecision);

	useEffect(() => {
		setDecision(initialDecision);
	}, [vehicleId, initialDecision]);

	const data = detail.data;
	const pending = data?.status === 'PENDING';

	const submit = () => {
		if (!vehicleId || !decision) return;
		review.mutate(
			{ id: vehicleId, decision },
			{ onSuccess: () => onClose() },
		);
	};

	return (
		<Modal open={open} onClose={onClose} title="Ficha da viatura" size="xl">
			{detail.isLoading ? (
				<div className="space-y-4">
					<div className="h-20 animate-skeleton rounded-lg bg-border/40" />
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
						{Array.from({ length: 3 }).map((_, index) => (
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
					context="a ficha desta viatura"
					onRetry={() => detail.refetch()}
				/>
			) : data ? (
				<div className="space-y-6">
					<div className="flex flex-wrap items-start justify-between gap-3 rounded-lg bg-background p-4">
						<div>
							<div className="flex flex-wrap items-center gap-2">
								<span className="font-mono text-lg font-sansBold text-text">
									{data.plate}
								</span>
								<StatusBadge
									status={data.status}
									label={enumLabel(
										VERIFICATION_STATUS_LABELS,
										data.status,
									)}
								/>
							</div>
							<p className="mt-1 text-sm text-text-secondary">
								{data.make} {data.model} · {data.color} ·{' '}
								{data.seats} lugares
							</p>
							<p className="mt-0.5 font-mono text-xs text-text-secondary">
								{data.id}
							</p>
						</div>
						<div className="rounded-md bg-surface px-3 py-2 text-right">
							<p className="text-xs uppercase text-text-secondary">
								Viagens
							</p>
							<p className="text-lg font-sansBold">
								{data._count.rides}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
						<Info
							label="Proprietário"
							value={
								[data.owner.name, data.owner.surname]
									.filter(Boolean)
									.join(' ') || 'Sem nome'
							}
						/>
						<Info
							label="Telefone"
							value={data.owner.phone ?? '—'}
						/>
						<Info label="Email" value={data.owner.email} />
						<Info
							label="Registada"
							value={fmtDate(data.createdAt)}
						/>
						<Info
							label="Verificada"
							value={
								data.verifiedAt
									? fmtDateTime(data.verifiedAt)
									: '—'
							}
						/>
						<Info
							label="Actualizada"
							value={fmtDateTime(data.updatedAt)}
						/>
					</div>

					<section>
						<h4 className="mb-3 text-sm font-sansBold text-text">
							Fotografias
						</h4>
						<ImageGallery
							images={data.photos}
							emptyMessage="Esta viatura não tem fotografias."
						/>
					</section>

					{canReview && pending ? (
						<section className="rounded-lg border p-4">
							<h4 className="text-sm font-sansBold text-text">
								Decisão
							</h4>
							<p className="mt-0.5 text-xs text-text-secondary">
								Aprovar permite ao motorista publicar corridas
								com esta viatura. Recusar devolve-a ao
								proprietário para correcção.
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

							<button
								type="button"
								onClick={submit}
								disabled={!decision || review.isPending}
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
								? 'Só quem revê viaturas pode decidir.'
								: 'Esta viatura já foi revista.'}
						</p>
					)}
				</div>
			) : null}
		</Modal>
	);
}
