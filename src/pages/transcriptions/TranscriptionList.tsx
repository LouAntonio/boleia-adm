import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranscriptions } from '../../hooks/queries/useTranscriptions';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatsCard } from '../../components/ui/StatsCard';
import { format } from 'date-fns';
import {
	enumLabel,
	TRANSCRIPTION_STATUS_LABELS,
	TRANSCRIPTION_TYPE_LABELS,
	LANGUAGE_LABELS,
	AI_STATUS_LABELS,
} from '../../lib/enums';
import {
	FileText,
	CheckCircle,
	Loader,
	AlertCircle,
	Mic,
	Upload,
	Clock,
	Brain,
	Calendar,
} from 'lucide-react';

export function TranscriptionList() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const limit = 20;

	const { data, isLoading } = useTranscriptions({
		page,
		limit,
		...filters,
	});
	const result = data ?? { transcriptions: [], total: 0, stats: null };
	const transcriptions = result.transcriptions ?? [];
	const total = result.total ?? 0;
	const stats = result.stats;

	const handleFilterChange = (key: string, val: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: val }));
		setPage(1);
	};

	const handleDateChange = (key: string, val: string) => {
		setFilters((prev) => ({
			...prev,
			[key]: val
				? key === 'startDate'
					? new Date(val).toISOString()
					: new Date(
							new Date(val).getTime() + 86_399_000,
						).toISOString()
				: undefined,
		}));
		setPage(1);
	};

	const formatDuration = (seconds: number) => {
		if (!seconds) return '0s';
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		const s = seconds % 60;
		if (h > 0) return `${h}h ${m}m`;
		if (m > 0) return `${m}m ${s}s`;
		return `${s}s`;
	};

	return (
		<div>
			<PageHeader
				title="Transcrições"
				subtitle="Histórico de transcrições da plataforma"
			/>

			{stats && (
				<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
					<StatsCard
						label="Total"
						value={stats.total}
						subtitle="Transcrições"
						icon={FileText}
					/>
					<StatsCard
						label="Concluídas"
						value={stats.byStatus.DONE}
						subtitle={`${stats.total ? Math.round((stats.byStatus.DONE / stats.total) * 100) : 0}% do total`}
						icon={CheckCircle}
					/>
					<StatsCard
						label="Processando"
						value={stats.byStatus.PROCESSING}
						subtitle="Em andamento"
						icon={Loader}
					/>
					<StatsCard
						label="Falhas"
						value={stats.byStatus.FAILED}
						subtitle={`${stats.total ? Math.round((stats.byStatus.FAILED / stats.total) * 100) : 0}%`}
						icon={AlertCircle}
					/>
					<StatsCard
						label="Hoje"
						value={stats.todayCount}
						subtitle="Criadas hoje"
						icon={Calendar}
					/>
					<StatsCard
						label="Tempo Real"
						value={stats.byType.REALTIME}
						subtitle={`${stats.total ? Math.round((stats.byType.REALTIME / stats.total) * 100) : 0}%`}
						icon={Mic}
					/>
					<StatsCard
						label="Upload"
						value={stats.byType.UPLOAD}
						subtitle={`${stats.total ? Math.round((stats.byType.UPLOAD / stats.total) * 100) : 0}%`}
						icon={Upload}
					/>
					<StatsCard
						label="IA Processadas"
						value={stats.withAICompleted}
						subtitle="Com IA concluída"
						icon={Brain}
					/>
					<StatsCard
						label="Duração Total"
						value={formatDuration(stats.totalDuration)}
						subtitle="Acumulado"
						icon={Clock}
					/>
				</div>
			)}

			<FilterBar
				placeholder="Nome do utilizador..."
				onSearch={(val) => {
					setFilters((prev) => ({
						...prev,
						search: val || undefined,
					}));
					setPage(1);
				}}
				selectFilters={[
					{
						key: 'status',
						label: 'Estado',
						options: [
							{ label: 'Pendente', value: 'PENDING' },
							{ label: 'Processando', value: 'PROCESSING' },
							{ label: 'Concluído', value: 'DONE' },
							{ label: 'Falhou', value: 'FAILED' },
						],
					},
					{
						key: 'type',
						label: 'Tipo',
						options: [
							{ label: 'Tempo Real', value: 'REALTIME' },
							{ label: 'Upload', value: 'UPLOAD' },
						],
					},
					{
						key: 'language',
						label: 'Idioma',
						options: [
							{ label: 'Português', value: 'PT' },
							{ label: 'Inglês', value: 'EN' },
							{ label: 'Francês', value: 'FR' },
						],
					},
				]}
				filterValues={filters}
				onFilterChange={handleFilterChange}
			/>

			<div className="mb-4 flex flex-wrap items-end gap-3">
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Data início
					</label>
					<input
						type="date"
						value={
							filters.startDate
								? filters.startDate.slice(0, 10)
								: ''
						}
						onChange={(e) =>
							handleDateChange('startDate', e.target.value)
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
						value={
							filters.endDate ? filters.endDate.slice(0, 10) : ''
						}
						onChange={(e) =>
							handleDateChange('endDate', e.target.value)
						}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					/>
				</div>
				{(filters.startDate || filters.endDate) && (
					<button
						onClick={() =>
							setFilters((prev) => ({
								...prev,
								startDate: undefined,
								endDate: undefined,
							}))
						}
						className="rounded-lg border bg-background px-4 py-2 text-sm text-text-secondary hover:text-text"
					>
						Limpar datas
					</button>
				)}
			</div>

			<DataTable
				loading={isLoading}
				columns={[
					{
						key: 'user',
						label: 'Utilizador',
						render: (t) => t.user?.name ?? '—',
					},
					{
						key: 'type',
						label: 'Tipo',
						render: (t) => (
							<StatusBadge
								status={t.type}
								variant={
									t.type === 'REALTIME' ? 'info' : 'neutral'
								}
								label={enumLabel(
									TRANSCRIPTION_TYPE_LABELS,
									t.type,
								)}
							/>
						),
					},
					{
						key: 'status',
						label: 'Estado',
						render: (t) => {
							const v =
								t.status === 'DONE'
									? 'success'
									: t.status === 'PROCESSING'
										? 'warning'
										: t.status === 'FAILED'
											? 'error'
											: 'neutral';
							return (
								<StatusBadge
									status={t.status}
									variant={v as any}
									label={enumLabel(
										TRANSCRIPTION_STATUS_LABELS,
										t.status,
									)}
								/>
							);
						},
					},
					{
						key: 'language',
						label: 'Idioma',
						render: (t) => enumLabel(LANGUAGE_LABELS, t.language),
					},
					{
						key: 'duration',
						label: 'Duração (s)',
						render: (t) => (t.duration ? `${t.duration}s` : '—'),
					},
					{
						key: 'aiStatus',
						label: 'IA',
						render: (t) => {
							const v =
								t.aiStatus === 'COMPLETED'
									? 'success'
									: t.aiStatus === 'PROCESSING'
										? 'warning'
										: t.aiStatus === 'FAILED'
											? 'error'
											: 'neutral';
							return (
								<StatusBadge
									status={t.aiStatus}
									variant={v as any}
									label={enumLabel(
										AI_STATUS_LABELS,
										t.aiStatus,
									)}
								/>
							);
						},
					},
					{
						key: 'createdAt',
						label: 'Data',
						sortable: true,
						render: (t) =>
							format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm'),
					},
				]}
				data={transcriptions}
				onRowClick={(t) => navigate(`/transcriptions/${t.id}`)}
			/>

			<Pagination
				page={page}
				limit={limit}
				total={total}
				onPageChange={setPage}
			/>
		</div>
	);
}
