import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	useUser,
	useUpdateUserRole,
	useAssignPlan,
} from '../../hooks/queries/useUsers';
import { usePlans } from '../../hooks/queries/usePlans';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { format } from 'date-fns';
import {
	enumLabel,
	USER_ROLE_LABELS,
	SUBSCRIPTION_STATUS_LABELS,
	PAYMENT_STATUS_LABELS,
	PAYMENT_METHOD_LABELS,
	PAYMENT_TYPE_LABELS,
} from '../../lib/enums';

const roles = ['USER', 'SUPPORT', 'ADMIN'];
const roleLabels: Record<string, string> = {
	USER: 'Utilizador',
	SUPPORT: 'Suporte',
	ADMIN: 'Administrador',
};

export function UserDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: user, isLoading } = useUser(id!);
	const updateRole = useUpdateUserRole();
	const assignPlan = useAssignPlan(id!);
	const { data: plans = [] } = usePlans();

	const [roleModal, setRoleModal] = useState(false);
	const [newRole, setNewRole] = useState('');
	const [planModal, setPlanModal] = useState(false);
	const [selectedPlanId, setSelectedPlanId] = useState('');
	const [durationDays, setDurationDays] = useState('');

	if (isLoading) return <p className="text-text-secondary">A carregar...</p>;
	if (!user) return <p className="text-error">Utilizador não encontrado.</p>;

	return (
		<div>
			<PageHeader
				title={user.name}
				subtitle={`ID: ${user.id}`}
				actions={
					<div className="flex gap-2">
						<button
							onClick={() => navigate('/users')}
							className="rounded-lg border bg-background px-4 py-2 text-sm"
						>
							Voltar
						</button>
						<button
							onClick={() => {
								setSelectedPlanId('');
								setDurationDays('');
								setPlanModal(true);
							}}
							className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
						>
							Atribuir Plano
						</button>
						<button
							onClick={() => {
								setNewRole(user.role);
								setRoleModal(true);
							}}
							className="rounded-lg border bg-background px-4 py-2 text-sm"
						>
							Alterar Role
						</button>
					</div>
				}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-lg border bg-surface p-5 space-y-3">
					<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
						Informações
					</h2>
					<DetailRow label="Nome" value={user.name} />
					<DetailRow label="Email" value={user.email} />
					<DetailRow
						label="Role"
						value={
							<StatusBadge
								status={user.role}
								label={enumLabel(USER_ROLE_LABELS, user.role)}
							/>
						}
					/>
					<DetailRow
						label="Email Verificado"
						value={user.emailVerified ? 'Sim' : 'Não'}
					/>
					<DetailRow
						label="Criado em"
						value={format(
							new Date(user.createdAt),
							'dd/MM/yyyy HH:mm',
						)}
					/>
				</div>

				{user._count && (
					<div className="rounded-lg border bg-surface p-5 space-y-3">
						<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
							Estatísticas
						</h2>
						<DetailRow
							label="Transcrições"
							value={String(user._count.transcriptions ?? 0)}
						/>
						<DetailRow
							label="Pagamentos"
							value={String(user._count.payments ?? 0)}
						/>
					</div>
				)}

				{user.subscriptions?.length > 0 && (
					<div className="rounded-lg border bg-surface p-5 space-y-3">
						<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
							Subscrições
						</h2>
						{user.subscriptions.map((sub: any) => (
							<div
								key={sub.id}
								className="border-b border-border pb-2 last:border-0"
							>
								<p className="text-sm font-medium">
									{sub.plan?.name ?? '—'}
								</p>
								<p className="text-xs text-text-secondary">
									<StatusBadge
										status={sub.status}
										label={enumLabel(
											SUBSCRIPTION_STATUS_LABELS,
											sub.status,
										)}
									/>
								</p>
								<p className="text-xs text-text-secondary">
									{format(
										new Date(sub.startDate),
										'dd/MM/yyyy',
									)}
									{sub.endDate &&
										` — ${format(new Date(sub.endDate), 'dd/MM/yyyy')}`}
								</p>
							</div>
						))}
					</div>
				)}
				{user.payments?.length > 0 && (
					<div className="rounded-lg border bg-surface p-5 space-y-3 lg:col-span-2">
						<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
							Pagamentos ({user.payments.length})
						</h2>
						{user.payments.map((p: any) => {
							const v =
								p.status === 'SUCCESS'
									? 'success'
									: p.status === 'FAILED'
										? 'error'
										: p.status === 'PENDING'
											? 'warning'
											: 'neutral';
							return (
								<div
									key={p.id}
									className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 last:border-0"
								>
									<div>
										<p className="text-sm font-medium">
											{new Intl.NumberFormat(
												'pt-AO',
											).format(Number(p.amount))}{' '}
											KZ — {p.plan?.name ?? '—'}
										</p>
										<p className="text-xs text-text-secondary">
											{enumLabel(
												PAYMENT_METHOD_LABELS,
												p.method,
											)}
											{' · '}
											{enumLabel(
												PAYMENT_TYPE_LABELS,
												p.type,
											)}
											{' · '}
											{format(
												new Date(p.createdAt),
												'dd/MM/yyyy HH:mm',
											)}
										</p>
									</div>
									<StatusBadge
										status={p.status}
										variant={v as any}
										label={enumLabel(
											PAYMENT_STATUS_LABELS,
											p.status,
										)}
									/>
								</div>
							);
						})}
					</div>
				)}
			</div>

			<Modal
				open={roleModal}
				onClose={() => setRoleModal(false)}
				title="Alterar Role"
			>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Novo Role
						</label>
						<select
							value={newRole}
							onChange={(e) => setNewRole(e.target.value)}
							className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						>
							{roles.map((r) => (
								<option key={r} value={r}>
									{roleLabels[r]}
								</option>
							))}
						</select>
					</div>
					<button
						onClick={() =>
							updateRole.mutate(
								{ id: id!, role: newRole },
								{ onSuccess: () => setRoleModal(false) },
							)
						}
						className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
					>
						Confirmar
					</button>
				</div>
			</Modal>

			<Modal
				open={planModal}
				onClose={() => setPlanModal(false)}
				title="Atribuir Plano"
			>
				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium mb-1">
							Plano
						</label>
						<select
							value={selectedPlanId}
							onChange={(e) => setSelectedPlanId(e.target.value)}
							className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						>
							<option value="">Selecionar plano...</option>
							{plans.map((p: any) => (
								<option key={p.id} value={p.id}>
									{p.name} —{' '}
									{new Intl.NumberFormat('pt-AO').format(
										Number(p.price),
									)}{' '}
									KZ
								</option>
							))}
						</select>
					</div>
					<div>
						<label className="block text-sm font-medium mb-1">
							Duração (dias){' '}
							<span className="text-text-secondary font-normal">
								— opcional
							</span>
						</label>
						<input
							type="number"
							min="1"
							value={durationDays}
							onChange={(e) => setDurationDays(e.target.value)}
							placeholder="Usar padrão do plano"
							className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						/>
					</div>
					<button
						disabled={!selectedPlanId || assignPlan.isPending}
						onClick={() => {
							const payload: any = { planId: selectedPlanId };
							if (durationDays)
								payload.durationDays = Number(durationDays);
							assignPlan.mutate(payload, {
								onSuccess: () => setPlanModal(false),
							});
						}}
						className="rounded-lg bg-primary px-4 py-2 text-sm text-white disabled:opacity-50"
					>
						{assignPlan.isPending ? 'A atribuir...' : 'Confirmar'}
					</button>
				</div>
			</Modal>
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
