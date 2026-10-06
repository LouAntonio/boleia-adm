import { useState } from 'react';
import { useAuditLogs } from '../../hooks/queries/useAuditLogs';
import { useUsers } from '../../hooks/queries/useUsers';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { format } from 'date-fns';
import { enumLabel } from '../../lib/enums';

const actionLabels: Record<string, string> = {
	USER_CREATED: 'Utilizador Criado',
	USER_UPDATED: 'Utilizador Actualizado',
	USER_DELETED: 'Utilizador Removido',
	USER_ROLE_CHANGED: 'Role Alterado',
	TRANSCRIPTION_DELETED: 'Transcrição Removida',
	PAYMENT_REFUNDED: 'Pagamento Reembolsado',
	PLAN_CREATED: 'Plano Criado',
	PLAN_UPDATED: 'Plano Actualizado',
	PLAN_DELETED: 'Plano Removido',
	LOGIN: 'Login',
	LOGOUT: 'Logout',
};

export function AuditLogList() {
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const [selectedLog, setSelectedLog] = useState<any>(null);
	const limit = 30;

	const cleanFilters = Object.fromEntries(
		Object.entries(filters).filter(([, v]) => v !== undefined && v !== ''),
	);

	const { data, isLoading } = useAuditLogs({
		page,
		limit,
		action: search || undefined,
		...cleanFilters,
	});
	const result = data ?? { logs: [], total: 0 };
	const logs = result.logs ?? [];
	const total = result.total ?? 0;

	const { data: usersData } = useUsers({ limit: 100 });
	const users =
		usersData && 'users' in usersData ? (usersData.users ?? []) : [];

	const handleSearch = (val: string) => {
		setSearch(val);
		setPage(1);
	};

	const handleFilterChange = (key: string, val: string | undefined) => {
		setFilters((prev) => ({ ...prev, [key]: val }));
		setPage(1);
	};

	return (
		<div>
			<PageHeader
				title="Registo de Auditoria"
				subtitle="Histórico de ações na plataforma"
			/>

			<div className="mb-4 flex flex-wrap items-end gap-3">
				<div className="min-w-[200px] max-w-xs flex-1">
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Ação
					</label>
					<input
						value={search}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Ex.: USER_, PLAN_..."
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
					/>
				</div>
				<div className="min-w-[160px]">
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Utilizador
					</label>
					<select
						value={filters.userId ?? ''}
						onChange={(e) =>
							handleFilterChange(
								'userId',
								e.target.value || undefined,
							)
						}
						className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					>
						<option value="">Todos</option>
						{users.map((u: any) => (
							<option key={u.id} value={u.id}>
								{u.name}
							</option>
						))}
					</select>
				</div>
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Data início
					</label>
					<input
						type="date"
						value={filters.startDate ?? ''}
						onChange={(e) =>
							handleFilterChange(
								'startDate',
								e.target.value || undefined,
							)
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
						value={filters.endDate ?? ''}
						onChange={(e) =>
							handleFilterChange(
								'endDate',
								e.target.value || undefined,
							)
						}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					/>
				</div>
			</div>

			<DataTable
				loading={isLoading}
				columns={[
					{
						key: 'user',
						label: 'Utilizador',
						render: (l) =>
							l.user?.name ?? l.userId?.slice(0, 8) ?? '—',
					},
					{
						key: 'action',
						label: 'Ação',
						render: (l) => (
							<StatusBadge
								status={l.action}
								variant="info"
								label={enumLabel(actionLabels, l.action)}
							/>
						),
					},
					{
						key: 'details',
						label: 'Detalhes',
						render: (l) =>
							l.details
								? JSON.stringify(l.details).slice(0, 80)
								: '—',
					},
					{
						key: 'ipAddress',
						label: 'IP',
						render: (l) => l.ipAddress ?? '—',
					},
					{
						key: 'createdAt',
						label: 'Data',
						render: (l) =>
							format(new Date(l.createdAt), 'dd/MM/yyyy HH:mm'),
					},
				]}
				data={logs}
				onRowClick={(l) => setSelectedLog(l)}
			/>

			<Pagination
				page={page}
				limit={limit}
				total={total}
				onPageChange={setPage}
			/>

			<Modal
				open={!!selectedLog}
				onClose={() => setSelectedLog(null)}
				title={
					selectedLog
						? enumLabel(actionLabels, selectedLog.action)
						: ''
				}
				size="lg"
			>
				{selectedLog && (
					<div className="space-y-3 text-sm">
						<div className="flex justify-between border-b border-border pb-2">
							<span className="text-text-secondary">
								Utilizador
							</span>
							<span className="font-medium">
								{selectedLog.user
									? `${selectedLog.user.name} (${selectedLog.user.email})`
									: (selectedLog.userId ?? '—')}
							</span>
						</div>
						<div className="flex justify-between border-b border-border pb-2">
							<span className="text-text-secondary">
								Data / Hora
							</span>
							<span className="font-medium">
								{format(
									new Date(selectedLog.createdAt),
									'dd/MM/yyyy HH:mm:ss',
								)}
							</span>
						</div>
						<div className="flex justify-between border-b border-border pb-2">
							<span className="text-text-secondary">IP</span>
							<span className="font-medium">
								{selectedLog.ipAddress ?? '—'}
							</span>
						</div>
						<div className="border-b border-border pb-2">
							<span className="text-text-secondary">
								User Agent
							</span>
							<p className="mt-1 break-all font-medium">
								{selectedLog.userAgent ?? '—'}
							</p>
						</div>
						<div>
							<span className="text-text-secondary">
								Detalhes
							</span>
							<pre className="mt-1 max-h-64 overflow-auto rounded-lg border bg-background p-3 text-xs whitespace-pre-wrap break-all">
								{selectedLog.details
									? JSON.stringify(
											selectedLog.details,
											null,
											2,
										)
									: '—'}
							</pre>
						</div>
						<div className="flex justify-end pt-2">
							<button
								onClick={() => setSelectedLog(null)}
								className="rounded-lg border bg-background px-6 py-2 text-sm"
							>
								Fechar
							</button>
						</div>
					</div>
				)}
			</Modal>
		</div>
	);
}
