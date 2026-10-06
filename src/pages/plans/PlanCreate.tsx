import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePlan } from '../../hooks/queries/usePlans';
import { PageHeader } from '../../components/ui/PageHeader';
import { PlanFieldsGuide } from './PlanFieldsGuide';

export function PlanCreate() {
	const navigate = useNavigate();
	const createPlan = useCreatePlan();
	const [form, setForm] = useState({
		name: '',
		price: 0,
		status: 'ACTIVE',
		hasAI: false,
		uploadMaxMB: undefined as number | undefined,
		uploadMaxSec: undefined as number | undefined,
		uploadCooldownMin: 0,
		uploadQtyInWindow: 1,
		realtimeMaxSec: undefined as number | undefined,
		realtimeCooldownMin: 0,
		aiMaxRequests: undefined as number | undefined,
		aiResetDays: 30,
	});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const payload = { ...form };
		if (!payload.uploadMaxMB) delete payload.uploadMaxMB;
		if (!payload.uploadMaxSec) delete payload.uploadMaxSec;
		if (!payload.realtimeMaxSec) delete payload.realtimeMaxSec;
		if (!payload.aiMaxRequests) delete payload.aiMaxRequests;
		createPlan.mutate(payload, {
			onSuccess: () => navigate('/plans'),
		});
	};

	return (
		<div>
			<PageHeader
				title="Novo Plano"
				subtitle="Criar um novo plano de subscrição"
			/>

			<div className="grid gap-6 lg:grid-cols-2">
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
							Preço (KZ)
						</label>
						<input
							type="number"
							min={0}
							value={form.price}
							onChange={(e) =>
								setForm({
									...form,
									price: Number(e.target.value),
								})
							}
							className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							required
						/>
					</div>

					<div>
						<label className="block text-sm font-medium mb-1">
							Status
						</label>
						<select
							value={form.status}
							onChange={(e) =>
								setForm({ ...form, status: e.target.value })
							}
							className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						>
							<option value="ACTIVE">Activo</option>
							<option value="INACTIVE">Inactivo</option>
							<option value="ARCHIVED">Arquivado</option>
						</select>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Cooldown Upload (min)
							</label>
							<input
								type="number"
								min={0}
								value={form.uploadCooldownMin}
								onChange={(e) =>
									setForm({
										...form,
										uploadCooldownMin: Number(
											e.target.value,
										),
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								Uploads por Janela
							</label>
							<input
								type="number"
								min={1}
								value={form.uploadQtyInWindow}
								onChange={(e) =>
									setForm({
										...form,
										uploadQtyInWindow: Number(
											e.target.value,
										),
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Realtime Max (seg)
							</label>
							<input
								type="number"
								value={form.realtimeMaxSec ?? ''}
								onChange={(e) =>
									setForm({
										...form,
										realtimeMaxSec: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								Cooldown Realtime (min)
							</label>
							<input
								type="number"
								min={0}
								value={form.realtimeCooldownMin}
								onChange={(e) =>
									setForm({
										...form,
										realtimeCooldownMin: Number(
											e.target.value,
										),
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								Upload Max (MB)
							</label>
							<input
								type="number"
								value={form.uploadMaxMB ?? ''}
								onChange={(e) =>
									setForm({
										...form,
										uploadMaxMB: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								Upload Max (seg)
							</label>
							<input
								type="number"
								value={form.uploadMaxSec ?? ''}
								onChange={(e) =>
									setForm({
										...form,
										uploadMaxSec: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div>
							<label className="block text-sm font-medium mb-1">
								IA Max Requests
							</label>
							<input
								type="number"
								value={form.aiMaxRequests ?? ''}
								onChange={(e) =>
									setForm({
										...form,
										aiMaxRequests: e.target.value
											? Number(e.target.value)
											: undefined,
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								IA Reset (dias)
							</label>
							<input
								type="number"
								value={form.aiResetDays}
								onChange={(e) =>
									setForm({
										...form,
										aiResetDays: Number(e.target.value),
									})
								}
								className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
							/>
						</div>
					</div>

					<div>
						<label className="flex items-center gap-2">
							<input
								type="checkbox"
								checked={form.hasAI}
								onChange={(e) =>
									setForm({
										...form,
										hasAI: e.target.checked,
									})
								}
								className="rounded border-border"
							/>
							<span className="text-sm font-medium">
								Com IA (Groq/Gemini)
							</span>
						</label>
					</div>

					<div className="flex gap-3">
						<button
							type="submit"
							disabled={createPlan.isPending}
							className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
						>
							{createPlan.isPending ? 'A criar...' : 'Criar'}
						</button>
						<button
							type="button"
							onClick={() => navigate('/plans')}
							className="rounded-lg border bg-background px-6 py-2 text-sm"
						>
							Cancelar
						</button>
					</div>
				</form>

				<PlanFieldsGuide />
			</div>
		</div>
	);
}
