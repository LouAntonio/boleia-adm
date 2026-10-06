import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
	usePayments,
	downloadBlobResponse,
	useEmailPaymentReport,
} from '../../hooks/queries/usePayments';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatsCard } from '../../components/ui/StatsCard';
import { Modal } from '../../components/ui/Modal';
import { format } from 'date-fns';
import apiClient from '../../lib/axios';
import { useAuthStore } from '../../stores/useAuthStore';
import {
	enumLabel,
	PAYMENT_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	PAYMENT_TYPE_LABELS,
} from '../../lib/enums';
import {
	CreditCard,
	CheckCircle,
	Loader,
	XCircle,
	Wallet,
	Banknote,
	FileDown,
	FileSpreadsheet,
	Mail,
	CalendarRange,
	FileText,
	Building,
	QrCode,
} from 'lucide-react';

const MONTHS = [
	'Janeiro',
	'Fevereiro',
	'Março',
	'Abril',
	'Maio',
	'Junho',
	'Julho',
	'Agosto',
	'Setembro',
	'Outubro',
	'Novembro',
	'Dezembro',
];

export function PaymentList() {
	const navigate = useNavigate();
	const user = useAuthStore((s) => s.user);
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [reportOpen, setReportOpen] = useState(false);
	const [emailTo, setEmailTo] = useState('');
	const [downloadingPdf, setDownloadingPdf] = useState(false);
	const [downloadingCsv, setDownloadingCsv] = useState(false);
	const emailReport = useEmailPaymentReport();
	const limit = 20;

	const cleanFilters = Object.fromEntries(
		Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
	);

	const reportParams = {
		startDate: cleanFilters.startDate,
		endDate: cleanFilters.endDate,
	};

	let periodLabel = 'Todo o histórico';
	if (cleanFilters.startDate && cleanFilters.endDate) {
		periodLabel = `${format(new Date(cleanFilters.startDate), 'dd/MM/yyyy')} – ${format(new Date(cleanFilters.endDate), 'dd/MM/yyyy')}`;
	} else if (cleanFilters.startDate) {
		periodLabel = `A partir de ${format(new Date(cleanFilters.startDate), 'dd/MM/yyyy')}`;
	} else if (cleanFilters.endDate) {
		periodLabel = `Até ${format(new Date(cleanFilters.endDate), 'dd/MM/yyyy')}`;
	}

	const handleDownloadReport = async (kind: 'pdf' | 'csv') => {
		const setter = kind === 'pdf' ? setDownloadingPdf : setDownloadingCsv;
		setter(true);
		try {
			const res = await apiClient.get(
				kind === 'pdf'
					? '/api/admin/payments/report'
					: '/api/admin/payments/report/csv',
				{
					params: reportParams,
					responseType: 'blob',
					timeout: 120000,
				},
			);
			downloadBlobResponse(
				res,
				kind === 'pdf'
					? 'kuzuela-relatorio-financeiro.pdf'
					: 'kuzuela-relatorio-financeiro.csv',
			);
			toast.success(
				kind === 'pdf' ? 'Relatório PDF descarregado' : 'CSV exportado',
			);
		} catch {
			toast.error('Não foi possível gerar o relatório');
		} finally {
			setter(false);
		}
	};

	const handleEmailReport = () => {
		const recipient = (emailTo || user?.email || '').trim();
		if (!/^\S+@\S+\.\S+$/.test(recipient)) {
			toast.error('Introduza um email válido');
			return;
		}
		emailReport.mutate(
			{ ...reportParams, email: recipient },
			{
				onSuccess: (data) => {
					toast.success(data?.message ?? 'Relatório enviado');
				},
				onError: () => {
					toast.error('Falha ao enviar o relatório por email');
				},
			},
		);
	};

	const { data, isLoading } = usePayments({
		page,
		limit,
		...cleanFilters,
	});
	const result = data ?? { payments: [], total: 0, stats: null };
	const payments = result.payments ?? [];
	const total = result.total ?? 0;
	const stats = result.stats;

	const handleMonthYearChange = (month?: number, year?: number) => {
		let startDate: string | undefined;
		let endDate: string | undefined;
		if (year !== undefined) {
			const m = month ?? 0;
			startDate = new Date(year, m, 1).toISOString();
			endDate = new Date(year, m + 1, 1).toISOString();
		}
		setFilters((prev) => ({
			...prev,
			month: month !== undefined ? String(month + 1) : prev.month,
			year: year !== undefined ? String(year) : prev.year,
			startDate,
			endDate,
			freeStartDate: undefined,
			freeEndDate: undefined,
		}));
		setPage(1);
	};

	return (
		<div>
			<PageHeader
				title="Pagamentos"
				subtitle="Transacções financeiras da plataforma"
				actions={
					<button
						onClick={() => {
							setEmailTo(user?.email ?? '');
							setReportOpen(true);
						}}
						className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
					>
						<FileText size={16} />
						Relatório
					</button>
				}
			/>

			{stats && (
				<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<StatsCard
						label="Total"
						value={stats.total}
						subtitle="Pagamentos"
						icon={CreditCard}
					/>
					<StatsCard
						label="Bem-sucedidos"
						value={stats.byStatus.SUCCESS}
						subtitle={`${stats.total ? Math.round((stats.byStatus.SUCCESS / stats.total) * 100) : 0}% do total`}
						icon={CheckCircle}
					/>
					<StatsCard
						label="Pendentes"
						value={stats.byStatus.PENDING}
						subtitle="A aguardar confirmação"
						icon={Loader}
					/>
					<StatsCard
						label="Falhados"
						value={stats.byStatus.FAILED}
						subtitle={`${stats.total ? Math.round((stats.byStatus.FAILED / stats.total) * 100) : 0}% do total`}
						icon={XCircle}
					/>
					<StatsCard
						label="Valor Total (KZ)"
						value={new Intl.NumberFormat('pt-AO').format(
							Number(stats.totalAmount),
						)}
						subtitle="Pagamentos bem-sucedidos"
						icon={Banknote}
					/>
					<StatsCard
						label="PayPay Wallet"
						value={stats.byMethod.PAYPAY_WALLET}
						subtitle="Por método"
						icon={Wallet}
					/>
					<StatsCard
						label="Transferência Bancária"
						value={stats.byMethod.BANK_TRANSFER}
						subtitle="Por método"
						icon={Building}
					/>
					<StatsCard
						label="KWiK QR Code"
						value={stats.byMethod.KWIK}
						subtitle="Por método"
						icon={QrCode}
					/>
				</div>
			)}

			<div className="mb-4 flex flex-wrap items-end gap-3">
				<div className="min-w-[140px]">
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Mês
					</label>
					<select
						value={filters.month ?? ''}
						onChange={(e) =>
							handleMonthYearChange(
								e.target.value
									? Number(e.target.value) - 1
									: undefined,
								filters.year ? Number(filters.year) : undefined,
							)
						}
						className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					>
						<option value="">Todos</option>
						{MONTHS.map((m, i) => (
							<option key={m} value={i + 1}>
								{m}
							</option>
						))}
					</select>
				</div>
				<div className="min-w-[140px]">
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Ano
					</label>
					<select
						value={filters.year ?? ''}
						onChange={(e) =>
							handleMonthYearChange(
								filters.month
									? Number(filters.month) - 1
									: undefined,
								e.target.value
									? Number(e.target.value)
									: undefined,
							)
						}
						className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					>
						<option value="">Todos</option>
						{Array.from({ length: 5 }, (_, i) => 2026 - i).map(
							(y) => (
								<option key={y} value={y}>
									{y}
								</option>
							),
						)}
					</select>
				</div>
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Data início
					</label>
					<input
						type="date"
						value={filters.freeStartDate ?? ''}
						onChange={(e) =>
							setFilters((prev) => ({
								...prev,
								month: undefined,
								year: undefined,
								startDate: e.target.value
									? new Date(e.target.value).toISOString()
									: undefined,
								freeStartDate: e.target.value || undefined,
							}))
						}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Data fim
					</label>
					<input
						type="date"
						value={filters.freeEndDate ?? ''}
						onChange={(e) => {
							const val = e.target.value;
							setFilters((prev) => ({
								...prev,
								month: undefined,
								year: undefined,
								endDate: val
									? new Date(
											new Date(val).getTime() +
												86_399_000,
										).toISOString()
									: undefined,
								freeEndDate: val || undefined,
							}));
						}}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					/>
				</div>
				<button
					onClick={() =>
						setFilters({
							month: undefined,
							year: undefined,
							startDate: undefined,
							endDate: undefined,
							freeStartDate: undefined,
							freeEndDate: undefined,
						})
					}
					className="rounded-lg border bg-background px-4 py-2 text-sm text-text-secondary hover:text-text"
				>
					Limpar filtros
				</button>
			</div>

			<DataTable
				loading={isLoading}
				columns={[
					{
						key: 'user',
						label: 'Utilizador',
						render: (p) => p.user?.name ?? '—',
					},
					{
						key: 'plan',
						label: 'Plano',
						render: (p) => p.plan?.name ?? '—',
					},
					{
						key: 'amount',
						label: 'Valor (KZ)',
						sortable: true,
						render: (p) =>
							new Intl.NumberFormat('pt-AO').format(
								Number(p.amount),
							),
					},
					{
						key: 'method',
						label: 'Método',
						render: (p) => (
							<StatusBadge
								status={p.method}
								variant="info"
								label={enumLabel(
									PAYMENT_METHOD_LABELS,
									p.method,
								)}
							/>
						),
					},
					{
						key: 'status',
						label: 'Estado',
						render: (p) => {
							const v =
								p.status === 'SUCCESS'
									? 'success'
									: p.status === 'FAILED'
										? 'error'
										: p.status === 'PENDING'
											? 'warning'
											: 'neutral';
							return (
								<StatusBadge
									status={p.status}
									variant={v as any}
									label={enumLabel(
										PAYMENT_STATUS_LABELS,
										p.status,
									)}
								/>
							);
						},
					},
					{
						key: 'type',
						label: 'Tipo',
						render: (p) => (
							<StatusBadge
								status={p.type}
								variant="neutral"
								label={enumLabel(PAYMENT_TYPE_LABELS, p.type)}
							/>
						),
					},
					{
						key: 'createdAt',
						label: 'Data',
						sortable: true,
						render: (p) =>
							format(new Date(p.createdAt), 'dd/MM/yyyy HH:mm'),
					},
				]}
				data={payments}
				onRowClick={(p) => navigate(`/payments/${p.id}`)}
			/>

			<Pagination
				page={page}
				limit={limit}
				total={total}
				onPageChange={setPage}
			/>

			<Modal
				open={reportOpen}
				onClose={() => setReportOpen(false)}
				title="Relatório Financeiro"
			>
				<div className="space-y-5">
					<div className="flex items-start gap-3 rounded-lg bg-background p-4">
						<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
							<CalendarRange size={18} />
						</div>
						<div>
							<p className="text-sm font-medium text-text">
								{periodLabel}
							</p>
							<p className="mt-0.5 text-xs text-text-secondary">
								O relatório inclui todos os estados e usa os
								filtros de data ativos nesta aba.
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
						<button
							onClick={() => handleDownloadReport('pdf')}
							disabled={downloadingPdf || downloadingCsv}
							className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
						>
							<FileDown size={16} />
							{downloadingPdf ? 'A gerar…' : 'Descarregar PDF'}
						</button>
						<button
							onClick={() => handleDownloadReport('csv')}
							disabled={downloadingPdf || downloadingCsv}
							className="flex items-center justify-center gap-2 rounded-lg border bg-surface px-4 py-2.5 text-sm font-medium text-text transition-colors hover:bg-background disabled:opacity-50"
						>
							<FileSpreadsheet size={16} />
							{downloadingCsv ? 'A exportar…' : 'Exportar CSV'}
						</button>
					</div>

					<div className="border-t pt-5">
						<label className="mb-1.5 block text-xs font-medium text-text-secondary">
							Enviar por email
						</label>
						<div className="flex gap-2">
							<input
								type="email"
								value={emailTo}
								onChange={(e) => setEmailTo(e.target.value)}
								onKeyDown={(e) =>
									e.key === 'Enter' && handleEmailReport()
								}
								placeholder="destinatario@empresa.com"
								className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
							/>
							<button
								onClick={handleEmailReport}
								disabled={emailReport.isPending}
								className="flex shrink-0 items-center gap-2 rounded-lg bg-sidebar px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
							>
								<Mail size={16} />
								{emailReport.isPending ? 'A enviar…' : 'Enviar'}
							</button>
						</div>
						<p className="mt-1.5 text-xs text-text-secondary">
							O PDF é gerado no servidor e anexado à mensagem.
						</p>
					</div>
				</div>
			</Modal>
		</div>
	);
}
