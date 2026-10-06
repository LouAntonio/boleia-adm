import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans, useUpdatePlan } from '../../hooks/queries/usePlans';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable } from '../../components/ui/DataTable';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { StatsCard } from '../../components/ui/StatsCard';
import { enumLabel, PLAN_STATUS_LABELS } from '../../lib/enums';
import { PlanFieldsGuide } from './PlanFieldsGuide';
import {
	Layers,
	CheckCircle,
	PauseCircle,
	Archive,
	Banknote,
} from 'lucide-react';

export function PlanList() {
	const navigate = useNavigate();
	const { data: plans, isLoading } = usePlans();
	const updatePlan = useUpdatePlan();

	const [editPlan, setEditPlan] = useState<any>(null);
	const [editForm, setEditForm] = useState<any>({});

	const list = Array.isArray(plans) ? plans : [];

	const stats = {
		total: list.length,
		active: list.filter((p: any) => p.status === 'ACTIVE').length,
		inactive: list.filter((p: any) => p.status === 'INACTIVE').length,
		archived: list.filter((p: any) => p.status === 'ARCHIVED').length,
	};
	const avgPrice =
		list.length > 0
			? list.reduce(
					(sum: number, p: any) => sum + Number(p.price ?? 0),
					0,
				) / list.length
			: 0;

	const openEdit = (plan: any) => {
		setEditPlan(plan);
		setEditForm({
			name: plan.name ?? '',
			price:
				typeof plan.price === 'string'
					? Number(plan.price)
					: (plan.price ?? 0),
			status: plan.status ?? 'ACTIVE',
			hasAI: plan.hasAI ?? false,
			uploadMaxMB: plan.uploadMaxMB ?? undefined,
			uploadMaxSec: plan.uploadMaxSec ?? undefined,
			uploadCooldownMin: plan.uploadCooldownMin ?? 0,
			uploadQtyInWindow: plan.uploadQtyInWindow ?? 1,
			realtimeMaxSec: plan.realtimeMaxSec ?? undefined,
			realtimeCooldownMin: plan.realtimeCooldownMin ?? 0,
			aiMaxRequests: plan.aiMaxRequests ?? undefined,
			aiResetDays: plan.aiResetDays ?? 30,
		});
	};

	const handleSave = () => {
		if (!editPlan) return;
		updatePlan.mutate(
			{ id: editPlan.id, ...editForm },
			{
				onSuccess: () => setEditPlan(null),
			},
		);
	};

	return (
		<div>
			<PageHeader
				title="Planos"
				subtitle="Gestão de planos de subscrição"
				actions={
					<button
						onClick={() => navigate('/plans/create')}
						className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
					>
						Novo Plano
					</button>
				}
			/>

			<div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
				<StatsCard
					label="Total"
					value={stats.total}
					subtitle="Planos"
					icon={Layers}
				/>
				<StatsCard
					label="Activos"
					value={stats.active}
					subtitle={`${stats.total ? Math.round((stats.active / stats.total) * 100) : 0}% do total`}
					icon={CheckCircle}
				/>
				<StatsCard
					label="Inactivos"
					value={stats.inactive}
					subtitle="Ocultos para novos clientes"
					icon={PauseCircle}
				/>
				<StatsCard
					label="Arquivados"
					value={stats.archived}
					subtitle="Descontinuados"
					icon={Archive}
				/>
				<StatsCard
					label="Preço Médio (KZ)"
					value={new Intl.NumberFormat('pt-AO').format(
						Math.round(avgPrice),
					)}
					subtitle="Média dos planos"
					icon={Banknote}
				/>
			</div>

			<DataTable
				loading={isLoading}
				columns={[
					{ key: 'name', label: 'Nome', sortable: true },
					{
						key: 'price',
						label: 'Preço (KZ)',
						sortable: true,
						render: (p) =>
							new Intl.NumberFormat('pt-AO').format(p.price),
					},
					{
						key: 'status',
						label: 'Estado',
						render: (p) => {
							const v =
								p.status === 'ACTIVE'
									? 'success'
									: p.status === 'INACTIVE'
										? 'warning'
										: 'error';
							return (
								<StatusBadge
									status={p.status}
									variant={v as any}
									label={enumLabel(
										PLAN_STATUS_LABELS,
										p.status,
									)}
								/>
							);
						},
					},
					{
						key: 'hasAI',
						label: 'IA',
						render: (p) => (p.hasAI ? 'Sim' : 'Não'),
					},
					{
						key: 'uploadMaxMB',
						label: 'Máx. Upload',
						render: (p) =>
							p.uploadMaxMB ? `${p.uploadMaxMB} MB` : '—',
					},
				]}
				data={list}
				onRowClick={openEdit}
			/>

			<Modal
				open={!!editPlan}
				onClose={() => setEditPlan(null)}
				title="Editar Plano"
				size="xl"
			>
				{editPlan && (
					<div className="grid gap-6 lg:grid-cols-2">
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-medium mb-1">
										Nome
									</label>
									<input
										value={editForm.name ?? ''}
										onChange={(e) =>
											setEditForm({
												...editForm,
												name: e.target.value,
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Preço (KZ)
									</label>
									<input
										type="number"
										value={editForm.price ?? 0}
										onChange={(e) =>
											setEditForm({
												...editForm,
												price: Number(e.target.value),
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Status
									</label>
									<select
										value={editForm.status ?? 'ACTIVE'}
										onChange={(e) =>
											setEditForm({
												...editForm,
												status: e.target.value,
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									>
										<option value="ACTIVE">Activo</option>
										<option value="INACTIVE">
											Inactivo
										</option>
										<option value="ARCHIVED">
											Arquivado
										</option>
									</select>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Upload Max (MB)
									</label>
									<input
										type="number"
										value={editForm.uploadMaxMB ?? ''}
										onChange={(e) =>
											setEditForm({
												...editForm,
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
										value={editForm.uploadMaxSec ?? ''}
										onChange={(e) =>
											setEditForm({
												...editForm,
												uploadMaxSec: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Cooldown Upload (min)
									</label>
									<input
										type="number"
										min={0}
										value={editForm.uploadCooldownMin ?? 0}
										onChange={(e) =>
											setEditForm({
												...editForm,
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
										value={editForm.uploadQtyInWindow ?? 1}
										onChange={(e) =>
											setEditForm({
												...editForm,
												uploadQtyInWindow: Number(
													e.target.value,
												),
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										Realtime Max (seg)
									</label>
									<input
										type="number"
										value={editForm.realtimeMaxSec ?? ''}
										onChange={(e) =>
											setEditForm({
												...editForm,
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
										value={
											editForm.realtimeCooldownMin ?? 0
										}
										onChange={(e) =>
											setEditForm({
												...editForm,
												realtimeCooldownMin: Number(
													e.target.value,
												),
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
								<div>
									<label className="block text-sm font-medium mb-1">
										IA Max Requests
									</label>
									<input
										type="number"
										value={editForm.aiMaxRequests ?? ''}
										onChange={(e) =>
											setEditForm({
												...editForm,
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
										value={editForm.aiResetDays ?? ''}
										onChange={(e) =>
											setEditForm({
												...editForm,
												aiResetDays: e.target.value
													? Number(e.target.value)
													: undefined,
											})
										}
										className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
									/>
								</div>
								<div className="flex items-end pb-2">
									<label className="flex items-center gap-2">
										<input
											type="checkbox"
											checked={editForm.hasAI ?? false}
											onChange={(e) =>
												setEditForm({
													...editForm,
													hasAI: e.target.checked,
												})
											}
											className="rounded border-border"
										/>
										<span className="text-sm font-medium">
											Com IA
										</span>
									</label>
								</div>
							</div>
							<div className="flex gap-3 pt-2">
								<button
									onClick={handleSave}
									disabled={updatePlan.isPending}
									className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
								>
									{updatePlan.isPending
										? 'A salvar...'
										: 'Salvar'}
								</button>
								<button
									onClick={() => setEditPlan(null)}
									className="rounded-lg border bg-background px-6 py-2 text-sm"
								>
									Cancelar
								</button>
							</div>
						</div>

						<PlanFieldsGuide />
					</div>
				)}
			</Modal>
		</div>
	);
}
