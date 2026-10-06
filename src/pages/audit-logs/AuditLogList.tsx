import { useState } from 'react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { useAuditActions, useAuditLogs } from '../../hooks/queries/useAdmin';
import {
	AUDIT_ACTION_LABELS,
	AUDIT_ENTITY_LABELS,
	USER_ROLE_LABELS,
	enumLabel,
} from '../../lib/enums';
import type { AuditEntry } from '../../types/admin';
import { ClipboardList } from 'lucide-react';

const ENTITY_OPTIONS = [
	{ value: '', label: 'Todas as entidades' },
	...Object.entries(AUDIT_ENTITY_LABELS).map(([value, label]) => ({
		value,
		label,
	})),
];

const fmtDateTime = (iso: string) =>
	new Date(iso).toLocaleString('pt-PT', {
		day: '2-digit',
		month: '2-digit',
		year: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});

/**
 * Trilha de auditoria.
 *
 * Lê `GET /api/admin/audit-logs`, que regista quem fez o quê sobre que
 * entidade. As acções que aparecem no filtro vêm do servidor
 * (`/audit-logs/actions`), não de uma lista local: mostrar acções que nunca
 * aconteceram dá opções que devolvem sempre zero.
 */
export function AuditLogList() {
	const [page, setPage] = useState(1);
	const [action, setAction] = useState('');
	const [entityType, setEntityType] = useState('');
	const [startDate, setStartDate] = useState('');
	const [endDate, setEndDate] = useState('');
	const [selected, setSelected] = useState<AuditEntry | null>(null);

	const { data: actions } = useAuditActions();
	const { data, isLoading } = useAuditLogs({
		page,
		limit: 30,
		action: action || undefined,
		entityType: entityType || undefined,
		startDate: startDate || undefined,
		endDate: endDate || undefined,
	});

	const rows = data?.rows ?? [];
	const total = data?.total ?? 0;

	const columns: Column<AuditEntry>[] = [
		{
			key: 'createdAt',
			label: 'Quando',
			sortable: true,
			render: (a) => (
				<span className="text-body-small">
					{fmtDateTime(a.createdAt)}
				</span>
			),
		},
		{
			key: 'actorName',
			label: 'Quem',
			sortable: true,
			render: (a) => (
				<div>
					<div className="text-body-small font-sansBold">
						{a.actorName ?? 'Sistema'}
					</div>
					<div className="text-xs text-text-secondary">
						{a.actorRole
							? enumLabel(USER_ROLE_LABELS, a.actorRole)
							: a.actorId
								? `conta removida (${a.actorId.slice(0, 8)})`
								: '—'}
					</div>
				</div>
			),
		},
		{
			key: 'action',
			label: 'Acção',
			sortable: true,
			render: (a) => (
				<StatusBadge
					status={a.action}
					label={enumLabel(AUDIT_ACTION_LABELS, a.action)}
					variant={variantFor(a.action)}
				/>
			),
		},
		{
			key: 'entityType',
			label: 'Entidade',
			sortable: true,
			render: (a) => (
				<div>
					<div className="text-body-small">
						{enumLabel(AUDIT_ENTITY_LABELS, a.entityType)}
					</div>
					{a.entityId ? (
						<div className="font-mono text-xs text-text-secondary">
							{a.entityId.slice(0, 8)}
						</div>
					) : null}
				</div>
			),
		},
		{
			key: 'ipAddress',
			label: 'IP',
			render: (a) => (
				<span className="font-mono text-xs text-text-secondary">
					{a.ipAddress ?? '—'}
				</span>
			),
		},
		{
			key: 'actions',
			label: '',
			render: (a) => (
				<button
					type="button"
					onClick={() => setSelected(a)}
					className="min-h-[32px] rounded-md border px-3 py-1.5 text-xs font-sansMedium hover:bg-background"
				>
					Detalhes
				</button>
			),
		},
	];

	const reset = () => {
		setAction('');
		setEntityType('');
		setStartDate('');
		setEndDate('');
		setPage(1);
	};

	return (
		<div>
			<PageHeader
				title="Auditoria"
				subtitle="Registo das acções administrativas"
				icon={ClipboardList}
			/>

			<div className="mb-3 flex flex-wrap items-end gap-3">
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						De
					</label>
					<input
						type="date"
						value={startDate}
						onChange={(e) => {
							setStartDate(e.target.value);
							setPage(1);
						}}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
					/>
				</div>
				<div>
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Até
					</label>
					<input
						type="date"
						value={endDate}
						onChange={(e) => {
							setEndDate(e.target.value);
							setPage(1);
						}}
						className="rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none focus:border-primary"
					/>
				</div>
				<button
					type="button"
					onClick={reset}
					className="min-h-[38px] rounded-lg border px-3 py-2 text-sm font-sansMedium text-text-secondary hover:bg-background"
				>
					Limpar filtros
				</button>
			</div>

			<FilterBar
				selectFilters={[
					{
						key: 'action',
						label: 'Acção',
						options: [
							{ value: '', label: 'Todas as acções' },
							...(actions ?? []).map((a) => ({
								value: a,
								label: enumLabel(AUDIT_ACTION_LABELS, a),
							})),
						],
					},
					{
						key: 'entityType',
						label: 'Entidade',
						options: ENTITY_OPTIONS,
					},
				]}
				filterValues={{ action, entityType }}
				onFilterChange={(key, value) => {
					if (key === 'action') setAction(value ?? '');
					if (key === 'entityType') setEntityType(value ?? '');
					setPage(1);
				}}
			/>

			<div className="mt-4">
				<DataTable
					columns={columns}
					data={rows}
					loading={isLoading}
					emptyMessage="Ainda não há acções registadas."
				/>
			</div>

			<div className="mt-4">
				<Pagination
					page={page}
					limit={30}
					total={total}
					onPageChange={setPage}
				/>
			</div>

			<Modal
				open={selected !== null}
				onClose={() => setSelected(null)}
				title="Detalhe da acção"
				size="lg"
			>
				{selected ? (
					<div className="space-y-4 text-body-small">
						<Row
							label="Acção"
							value={enumLabel(
								AUDIT_ACTION_LABELS,
								selected.action,
							)}
						/>
						<Row
							label="Entidade"
							value={`${enumLabel(AUDIT_ENTITY_LABELS, selected.entityType)}${
								selected.entityId
									? ` · ${selected.entityId}`
									: ''
							}`}
						/>
						<Row
							label="Quem"
							value={`${selected.actorName ?? 'Sistema'}${
								selected.actorRole
									? ` (${enumLabel(USER_ROLE_LABELS, selected.actorRole)})`
									: ''
							}`}
						/>
						<Row
							label="Quando"
							value={fmtDateTime(selected.createdAt)}
						/>
						<Row label="IP" value={selected.ipAddress ?? '—'} />
						<Row
							label="User agent"
							value={selected.userAgent ?? '—'}
						/>

						<div>
							<div className="mb-1 font-sansBold">Contexto</div>
							<pre className="max-h-56 overflow-auto rounded-lg bg-background p-3 font-mono text-xs">
								{selected.metadata
									? JSON.stringify(selected.metadata, null, 2)
									: 'Sem contexto adicional.'}
							</pre>
						</div>
					</div>
				) : null}
			</Modal>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-4 border-b pb-2 last:border-0">
			<span className="shrink-0 font-sansMedium text-text-secondary">
				{label}
			</span>
			<span className="text-right break-all">{value}</span>
		</div>
	);
}

/**
 * Cor da etiqueta.
 *
 * Recusagens e eliminações a vermelho, aprovações a verde, o resto neutro. É
 * leitura rápida: num feed de acções, o que exige atenção é o que rareja.
 */
function variantFor(
	action: string,
): 'success' | 'warning' | 'error' | 'info' | 'neutral' {
	if (action.includes('REJECTED') || action.includes('DELETED'))
		return 'error';
	if (action.includes('BANNED')) return 'warning';
	if (action.includes('APPROVED')) return 'success';
	if (action.includes('CREATED') || action.includes('SUBMITTED'))
		return 'info';
	return 'neutral';
}
