import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useCreateUser } from '../../hooks/queries/useUsers';
import { PageHeader } from '../../components/ui/PageHeader';

const roles = ['USER', 'SUPPORT', 'ADMIN'];
const roleLabels: Record<string, string> = {
	USER: 'Utilizador',
	SUPPORT: 'Suporte',
	ADMIN: 'Administrador',
};

export function UserCreate() {
	const navigate = useNavigate();
	const createUser = useCreateUser();
	const [form, setForm] = useState({
		name: '',
		email: '',
		role: 'USER',
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		createUser.mutate(form, {
			onSuccess: () => navigate('/users'),
		});
	};

	return (
		<div>
			<PageHeader
				title="Novo Utilizador"
				subtitle="Criar uma nova conta de utilizador"
			/>

			<form
				onSubmit={handleSubmit}
				className="max-w-lg space-y-4 rounded-lg border bg-surface p-6"
			>
				<div>
					<label className="block text-sm font-medium mb-1">
						Nome
					</label>
					<input
						value={form.name}
						onChange={(e) =>
							setForm({ ...form, name: e.target.value })
						}
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						required
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Email
					</label>
					<input
						type="email"
						value={form.email}
						onChange={(e) =>
							setForm({ ...form, email: e.target.value })
						}
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						required
					/>
				</div>

				<div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
					<Info size={18} className="mt-0.5 shrink-0" />
					<span>
						O utilizador receberá um email para definir a sua
						própria palavra-passe.
					</span>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Role
					</label>
					<select
						value={form.role}
						onChange={(e) =>
							setForm({ ...form, role: e.target.value })
						}
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
					>
						{roles.map((r) => (
							<option key={r} value={r}>
								{roleLabels[r]}
							</option>
						))}
					</select>
				</div>

				<div className="flex gap-3">
					<button
						type="submit"
						disabled={createUser.isPending}
						className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
					>
						{createUser.isPending ? 'A criar...' : 'Criar'}
					</button>
					<button
						type="button"
						onClick={() => navigate('/users')}
						className="rounded-lg border bg-background px-6 py-2 text-sm"
					>
						Cancelar
					</button>
				</div>
			</form>
		</div>
	);
}
