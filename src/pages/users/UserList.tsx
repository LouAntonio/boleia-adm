import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../hooks/queries/useUsers';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { FilterBar } from '../../components/ui/FilterBar';
import { Pagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';
import { enumLabel, USER_ROLE_LABELS } from '../../lib/enums';

export function UserList() {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState('');
	const [filters, setFilters] = useState<Record<string, string | undefined>>(
		{},
	);
	const limit = 20;

	const { data, isLoading } = useUsers({
		page,
		limit,
		search: search || undefined,
		...filters,
	});
	const result = data ?? { users: [], total: 0 };
	const users = result.users ?? [];
	const total = result.total ?? 0;

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
				title="Utilizadores"
				subtitle="Gestão de contas de utilizadores"
				actions={
					<button
						onClick={() => navigate('/users/create')}
						className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
					>
						Novo Utilizador
					</button>
				}
			/>

			<FilterBar
				placeholder="Nome, email..."
				onSearch={handleSearch}
				selectFilters={[
					{
						key: 'role',
						label: 'Função',
						options: [
							{ label: 'Utilizador', value: 'USER' },
							{ label: 'Suporte', value: 'SUPPORT' },
							{ label: 'Admin', value: 'ADMIN' },
						],
					},
				]}
				filterValues={filters}
				onFilterChange={handleFilterChange}
			/>

			<DataTable
				loading={isLoading}
				columns={[
					{ key: 'name', label: 'Nome', sortable: true },
					{ key: 'email', label: 'Email', sortable: true },
					{
						key: 'role',
						label: 'Role',
						render: (u) => (
							<StatusBadge
								status={u.role}
								label={enumLabel(USER_ROLE_LABELS, u.role)}
							/>
						),
					},
					{
						key: 'emailVerified',
						label: 'Email Verif.',
						render: (u) => (u.emailVerified ? 'Sim' : 'Não'),
					},
					{
						key: 'activePlan',
						label: 'Plano Ativo',
						render: (u) =>
							u.activePlan ? (
								<StatusBadge
									status="ACTIVE"
									variant="success"
									label={u.activePlan.name ?? '—'}
								/>
							) : (
								'—'
							),
					},
					{
						key: 'createdAt',
						label: 'Criado em',
						sortable: true,
						render: (u) =>
							format(new Date(u.createdAt), 'dd/MM/yyyy'),
					},
				]}
				data={users}
				onRowClick={(u) => navigate(`/users/${u.id}`)}
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
