import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, type Column } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { SearchInput } from '../../components/ui/SearchInput';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { useUsers } from '../../hooks/queries/useAdmin';
import { USER_ROLE_LABELS, enumLabel } from '../../lib/enums';
import type { AdminUser } from '../../types/admin';
import { Users } from 'lucide-react';

const ROLE_OPTIONS = [
	{ value: '', label: 'Todos os roles' },
	...Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
		value,
		label,
	})),
];

const fmtDate = (iso: string) =>
	new Date(iso).toLocaleDateString('pt-PT', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
	});

export function UserList() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [role, setRole] = useState('');
	const [search, setSearch] = useState('');
	const [query, setQuery] = useState('');

	const { data, isLoading, isError } = useUsers({
		page,
		limit: 20,
		role: role || undefined,
		search: query || undefined,
	});

	const rows = data?.users ?? [];
	const total = data?.total ?? 0;

	const columns: Column<AdminUser>[] = [
		{
			key: 'name',
			label: 'Nome',
			sortable: true,
			render: (u) => (
				<div>
					<div className="text-body-small font-sansBold">
						{[u.name, u.surname].filter(Boolean).join(' ')}
					</div>
					{u.phone ? (
						<div className="text-xs text-text-secondary">
							{u.phone}
						</div>
					) : null}
				</div>
			),
		},
		{ key: 'email', label: 'Email', sortable: true },
		{
			key: 'role',
			label: 'Role',
			sortable: true,
			render: (u) => (
				<StatusBadge
					status={u.role}
					label={enumLabel(USER_ROLE_LABELS, u.role)}
					variant={u.role === 'ADMIN' ? 'warning' : 'neutral'}
				/>
			),
		},
		{
			key: 'banned',
			label: 'Situação',
			render: (u) =>
				u.banned ? (
					<StatusBadge
						status="BANNED"
						label="Banido"
						variant="error"
					/>
				) : (
					<StatusBadge
						status="ACTIVE"
						label="Activo"
						variant="success"
					/>
				),
		},
		{
			key: 'createdAt',
			label: 'Registado',
			sortable: true,
			render: (u) => fmtDate(u.createdAt),
		},
	];

	return (
		<div>
			<PageHeader
				title="Utilizadores"
				subtitle="Contas da plataforma"
				icon={Users}
			/>

			<div className="space-y-3">
				<SearchInput
					onSearch={(v) => {
						setSearch(v);
						setQuery(v);
						setPage(1);
					}}
					placeholder="Procurar por nome"
				/>
				<FilterBar
					selectFilters={[
						{ key: 'role', label: 'Role', options: ROLE_OPTIONS },
					]}
					filterValues={{ role }}
					onFilterChange={(_key, value) => {
						setRole(value ?? '');
						setPage(1);
					}}
				/>
			</div>

			<div className="mt-4">
				{isError ? (
					<div className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-small text-error">
						Não foi possível carregar a lista de utilizadores.
					</div>
				) : (
					<DataTable
						columns={columns}
						data={rows}
						loading={isLoading}
						onRowClick={(u) => navigate(`/users/${u.id}`)}
						emptyMessage={
							search
								? `Nenhum utilizador para "${search}".`
								: 'Ainda não há utilizadores.'
						}
					/>
				)}
			</div>

			<div className="mt-4">
				<Pagination
					page={page}
					limit={20}
					total={total}
					onPageChange={setPage}
				/>
			</div>
		</div>
	);
}
