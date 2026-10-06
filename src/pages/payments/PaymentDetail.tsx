import { useParams, useNavigate } from 'react-router-dom';
import {
	usePayment,
	useValidatePayment,
} from '../../hooks/queries/usePayments';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';
import { CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import {
	enumLabel,
	PAYMENT_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	PAYMENT_TYPE_LABELS,
} from '../../lib/enums';
import { useState } from 'react';

export function PaymentDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: p, isLoading } = usePayment(id!);
	const validatePayment = useValidatePayment();
	const [rejectReason, setRejectReason] = useState('');
	const [showRejectReason, setShowRejectReason] = useState(false);

	if (isLoading) return <p className="text-text-secondary">A carregar...</p>;
	if (!p) return <p className="text-error">Pagamento não encontrado.</p>;

	const isBankTransferPending =
		p.method === 'BANK_TRANSFER' && p.status === 'PENDING';

	const handleValidate = (approved: boolean) => {
		const payload: any = { approved };
		if (!approved && rejectReason.trim()) {
			payload.reason = rejectReason.trim();
		}

		validatePayment.mutate(
			{ id: p.id, payload },
			{
				onSuccess: () => {
					toast.success(
						approved
							? 'Pagamento aprovado com sucesso'
							: 'Pagamento rejeitado',
					);
					setShowRejectReason(false);
					setRejectReason('');
				},
				onError: (err: any) => {
					toast.error(
						err?.response?.data?.message ||
							'Erro ao validar pagamento',
					);
				},
			},
		);
	};

	return (
		<div>
			<PageHeader
				title={`Pagamento #${p.id.slice(0, 8)}`}
				subtitle={format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm')}
				actions={
					<button
						onClick={() => navigate('/payments')}
						className="rounded-lg border bg-background px-4 py-2 text-sm"
					>
						Voltar
					</button>
				}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-lg border bg-surface p-5 space-y-3">
					<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
						Informações
					</h2>
					<DetailRow
						label="Valor"
						value={`${new Intl.NumberFormat('pt-AO').format(Number(p.amount))} KZ`}
					/>
					<DetailRow
						label="Estado"
						value={
							<StatusBadge
								status={p.status}
								variant={
									p.status === 'SUCCESS'
										? 'success'
										: p.status === 'FAILED'
											? 'error'
											: p.status === 'PENDING'
												? 'warning'
												: 'neutral'
								}
								label={enumLabel(
									PAYMENT_STATUS_LABELS,
									p.status,
								)}
							/>
						}
					/>
					<DetailRow
						label="Método"
						value={
							<StatusBadge
								status={p.method}
								variant="info"
								label={enumLabel(
									PAYMENT_METHOD_LABELS,
									p.method,
								)}
							/>
						}
					/>
					<DetailRow
						label="Tipo"
						value={
							<StatusBadge
								status={p.type}
								label={enumLabel(PAYMENT_TYPE_LABELS, p.type)}
							/>
						}
					/>
					<DetailRow label="Provider" value={p.provider ?? '—'} />
					<DetailRow
						label="Provider Status"
						value={p.providerStatus ?? '—'}
					/>
					{p.trade_no && (
						<DetailRow label="Trade No." value={p.trade_no} />
					)}
					{p.referenceCode && (
						<DetailRow
							label="Código Referência"
							value={p.referenceCode}
						/>
					)}
					{p.rejectReason && (
						<DetailRow
							label="Motivo Rejeição"
							value={
								<span className="text-error">
									{p.rejectReason}
								</span>
							}
						/>
					)}
				</div>

				<div className="rounded-lg border bg-surface p-5 space-y-3">
					<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
						Utilizador & Plano
					</h2>
					{p.user && (
						<>
							<DetailRow label="Nome" value={p.user.name} />
							<DetailRow label="Email" value={p.user.email} />
						</>
					)}
					{p.plan && (
						<>
							<DetailRow label="Plano" value={p.plan.name} />
							<DetailRow
								label="Preço Plano"
								value={`${new Intl.NumberFormat('pt-AO').format(Number(p.plan.price))} KZ`}
							/>
						</>
					)}
				</div>

				{/* Bank Transfer Proof Section */}
				{p.method === 'BANK_TRANSFER' && (
					<div className="rounded-lg border bg-surface p-5 space-y-4">
						<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
							Comprovativo de Transferência
						</h2>
						{p.proofUrl ? (
							<div className="space-y-3">
								<a
									href={p.proofUrl}
									target="_blank"
									rel="noopener noreferrer"
									className="flex items-center gap-2 text-primary hover:underline text-sm"
								>
									<ExternalLink size={14} />
									Abrir comprovativo em tamanho real
								</a>
								<div className="overflow-hidden rounded-lg border border-border">
									<iframe
										src={p.proofUrl}
										className="h-[500px] w-full bg-background"
										title="Comprovativo"
									/>
								</div>
							</div>
						) : (
							<p className="text-sm text-text-secondary">
								Nenhum comprovativo enviado.
							</p>
						)}

						{isBankTransferPending && (
							<div className="border-t border-border pt-4 space-y-3">
								<h3 className="text-sm font-medium text-text">
									Validação
								</h3>
								{showRejectReason && (
									<textarea
										value={rejectReason}
										onChange={(e) =>
											setRejectReason(e.target.value)
										}
										placeholder="Motivo da rejeição (opcional)"
										className="w-full rounded-lg border bg-background px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary resize-none"
										rows={3}
									/>
								)}
								<div className="flex gap-3">
									<button
										onClick={() => handleValidate(true)}
										disabled={validatePayment.isPending}
										className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
									>
										<CheckCircle size={16} />
										{validatePayment.isPending
											? 'A processar…'
											: 'Aprovar'}
									</button>
									{showRejectReason ? (
										<>
											<button
												onClick={() =>
													handleValidate(false)
												}
												disabled={
													validatePayment.isPending
												}
												className="flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-error-hover disabled:opacity-50"
											>
												<XCircle size={16} />
												{validatePayment.isPending
													? 'A processar…'
													: 'Confirmar Rejeição'}
											</button>
											<button
												onClick={() => {
													setShowRejectReason(false);
													setRejectReason('');
												}}
												className="rounded-lg border bg-background px-4 py-2 text-sm text-text-secondary hover:text-text"
											>
												Cancelar
											</button>
										</>
									) : (
										<button
											onClick={() =>
												setShowRejectReason(true)
											}
											className="flex items-center gap-2 rounded-lg border border-error px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10 disabled:opacity-50"
										>
											<XCircle size={16} />
											Rejeitar
										</button>
									)}
								</div>
							</div>
						)}
					</div>
				)}

				{p.refunds && p.refunds.length > 0 && (
					<div className="rounded-lg border bg-surface p-5 space-y-3">
						<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
							Reembolsos
						</h2>
						{p.refunds.map((refund: any) => (
							<div
								key={refund.id}
								className="border-b border-border pb-2 text-sm last:border-0"
							>
								<span className="text-text-secondary">
									{new Intl.NumberFormat('pt-AO').format(
										Number(refund.amount),
									)}{' '}
									KZ
								</span>
								<span className="ml-2">
									<StatusBadge
										status={refund.status}
										label={enumLabel(
											PAYMENT_STATUS_LABELS,
											refund.status,
										)}
									/>
								</span>
								<span className="ml-2 text-xs text-text-secondary">
									{format(
										new Date(refund.createdAt),
										'dd/MM/yyyy',
									)}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function DetailRow({
	label,
	value,
}: {
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex justify-between border-b border-border pb-2 text-sm">
			<span className="text-text-secondary">{label}</span>
			<span className="font-medium">{value}</span>
		</div>
	);
}
