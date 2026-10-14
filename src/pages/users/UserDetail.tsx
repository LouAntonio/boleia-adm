import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/ui/PageHeader';
import { Modal } from '../../components/ui/Modal';
import {
	useUser,
	useUserSessions,
	useRevokeUserSessions,
	useUpdateUserRole,
	useBanUser,
	useUnbanUser,
} from '../../hooks/queries/useAdmin';
import { USER_ROLE_LABELS, enumLabel } from '../../lib/enums';
import { fmtDate } from '../../lib/format';
import { useCan } from '../../lib/permissions';
import { ArrowLeft, Loader2, Ban, ShieldCheck } from 'lucide-react';

const ALL_ROLES = Object.keys(USER_ROLE_LABELS);

/**
 * Detalhe de um utilizador.
 *
 * As acções destrutivas — mudar role, banir, revogar sessões — só aparecem a
 * quem tem a permissão. Esconder o botão não é a protecção (o backend valida
 * sempre), mas evita um painel que promete acções que iam devolver 403.
 */
export function UserDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: user, isLoading, isError } = useUser(id);
	const { data: sessions } = useUserSessions(id);

	const canAdmin = useCan('administerUsers');
	const canModerate = useCan('moderate');

	const [roleOpen, setRoleOpen] = useState(false);
	const [banOpen, setBanOpen] = useState(false);
	const [reason, setReason] = useState('');
	const [newRole, setNewRole] = useState('');

	const updateRole = useUpdateUserRole();
	const ban = useBanUser();
	const unban = useUnbanUser();
	const revokeAll = useRevokeUserSessions();

	if (isLoading) {
		return (
			<p className="text-body-small text-text-secondary">A carregar…</p>
		);
	}

	if (isError || !user) {
		return (
			<div className="rounded-xl border border-error/30 bg-error/5 p-4 text-body-small text-error">
				Não foi possível carregar este utilizador.
			</div>
		);
	}

	const fullName = [user.name, user.surname].filter(Boolean).join(' ');

	return (
		<div>
			<button
				type="button"
				onClick={() => navigate(-1)}
				className="mb-4 inline-flex items-center gap-1.5 text-sm font-sansMedium text-text-secondary hover:text-text"
			>
				<ArrowLeft size={16} />
				Voltar
			</button>

			<PageHeader title={fullName} subtitle={user.email} />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="rounded-xl border bg-surface p-5 shadow-card lg:col-span-2">
					<h3 className="mb-4 text-label font-sansBold">Conta</h3>
					<dl className="space-y-3 text-body-small">
						<Row label="Nome" value={fullName} />
						<Row label="Email" value={user.email} />
						<Row label="Telefone" value={user.phone ?? '—'} />
						<Row
							label="Email verificado"
							value={user.emailVerified ? 'Sim' : 'Não'}
						/>
						<Row
							label="Role"
							value={enumLabel(USER_ROLE_LABELS, user.role)}
						/>
						<Row
							label="Registado em"
							value={fmtDate(user.createdAt)}
						/>
					</dl>

					{user.banned ? (
						<div className="mt-4 rounded-lg border border-error/30 bg-error/5 p-3">
							<div className="text-body-small font-sansBold text-error">
								Conta banida
							</div>
							{user.banReason ? (
								<p className="mt-1 text-body-xs text-text-secondary">
									{user.banReason}
								</p>
							) : null}
							{user.banExpires ? (
								<p className="mt-1 text-body-xs text-text-secondary">
									Expira a {fmtDate(user.banExpires)}
								</p>
							) : null}
						</div>
					) : null}

					<div className="mt-5 flex flex-wrap gap-2">
						{canAdmin ? (
							<button
								type="button"
								onClick={() => {
									setNewRole(user.role);
									setRoleOpen(true);
								}}
								className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-sansMedium hover:bg-background"
							>
								<ShieldCheck size={15} />
								Alterar role
							</button>
						) : null}

						{canModerate && !user.banned ? (
							<button
								type="button"
								onClick={() => {
									setReason('');
									setBanOpen(true);
								}}
								className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-error/40 px-3 py-2 text-sm font-sansMedium text-error hover:bg-error/5"
							>
								<Ban size={15} />
								Banir
							</button>
						) : null}

						{canModerate && user.banned ? (
							<button
								type="button"
								onClick={() => unban.mutate(user.id)}
								disabled={unban.isPending}
								className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-success px-3 py-2 text-sm font-sansBold text-white disabled:opacity-50"
							>
								Levantar banimento
							</button>
						) : null}
					</div>
				</div>

				<div className="rounded-xl border bg-surface p-5 shadow-card">
					<div className="mb-4 flex items-center justify-between">
						<h3 className="text-label font-sansBold">Sessões</h3>
						{sessions && sessions.total > 0 && canModerate ? (
							<button
								type="button"
								onClick={() => revokeAll.mutate(user.id)}
								disabled={revokeAll.isPending}
								className="min-h-[32px] rounded-md border px-2.5 py-1 text-xs font-sansMedium text-error hover:bg-error/5 disabled:opacity-50"
							>
								Revogar todas
							</button>
						) : null}
					</div>

					{!sessions || sessions.rows.length === 0 ? (
						<p className="text-body-small text-text-secondary">
							Sem sessões activas.
						</p>
					) : (
						<ul className="space-y-3">
							{sessions.rows.map((s) => (
								<li
									key={s.id}
									className="rounded-lg bg-background p-3 text-xs"
								>
									<div className="flex items-center justify-between gap-2">
										<span className="font-mono text-text-secondary">
											{s.ipAddress ?? 'ip desconhecido'}
										</span>
										<span className="flex items-center gap-2">
											{/*
											 * Uma sessão de impersonação é o sinal mais
											 * grave que esta lista pode mostrar, e
											 * estava a passar despercebida: o backend
											 * devolvia `impersonatedBy` e o painel
											 * ignorava-o.
											 */}
											{s.impersonatedBy ? (
												<span className="rounded bg-error/10 px-1.5 py-0.5 font-sansMedium text-error">
													impersonada
												</span>
											) : null}
											{s.isCurrent ? (
												<span className="rounded bg-brand/10 px-1.5 py-0.5 font-sansMedium text-brand">
													sessão actual
												</span>
											) : null}
											<span className="text-text-secondary">
												{fmtDate(s.createdAt)}
											</span>
										</span>
									</div>
									{/*
									 * `device`, não `userAgent`: é assim que o backend
									 * nomeia o campo (`sessions.service.ts`, `formatOwn`).
									 * O nome antigo nunca existiu nesta resposta, por isso
									 * esta lista mostrava "dispositivo desconhecido" em
									 * todas as linhas — inclusive na que se estava a
									 * investigar.
									 */}
									<p className="mt-1 truncate text-text-secondary">
										{s.device ?? 'dispositivo desconhecido'}
									</p>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>

			<Modal
				open={roleOpen}
				onClose={() => setRoleOpen(false)}
				title="Alterar role"
			>
				<div className="space-y-4">
					<p className="text-body-small text-text-secondary">
						Mudar o role dá ou tira acesso a este painel e a acções
						de administração. A alteração fica registada na
						auditoria.
					</p>
					<select
						value={newRole}
						onChange={(e) => setNewRole(e.target.value)}
						className="w-full rounded-lg border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
					>
						{ALL_ROLES.map((r) => (
							<option key={r} value={r}>
								{enumLabel(USER_ROLE_LABELS, r)}
							</option>
						))}
					</select>
					<button
						type="button"
						disabled={updateRole.isPending || newRole === user.role}
						onClick={() =>
							updateRole.mutate(
								{ userId: user.id, role: newRole },
								{ onSuccess: () => setRoleOpen(false) },
							)
						}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-sansBold text-white hover:bg-primary-hover disabled:opacity-50"
					>
						{updateRole.isPending ? (
							<Loader2 size={16} className="animate-spin" />
						) : null}
						Confirmar
					</button>
				</div>
			</Modal>

			<Modal
				open={banOpen}
				onClose={() => setBanOpen(false)}
				title="Banir utilizador"
			>
				<div className="space-y-4">
					<p className="text-body-small text-text-secondary">
						A conta deixa de conseguir entrar. Sem data de
						expiração, o banimento é permanente até ser levantado.
					</p>
					<div className="space-y-1.5">
						<label className="block text-sm font-medium text-text">
							Motivo
						</label>
						<textarea
							value={reason}
							onChange={(e) => setReason(e.target.value)}
							rows={3}
							placeholder="Ex.: documentos de identidade falsificados"
							className="w-full rounded-lg border bg-surface p-3 text-sm text-text outline-none focus:border-primary"
						/>
					</div>
					<button
						type="button"
						disabled={ban.isPending || !reason.trim()}
						onClick={() =>
							ban.mutate(
								{ userId: user.id, banReason: reason.trim() },
								{ onSuccess: () => setBanOpen(false) },
							)
						}
						className="flex w-full items-center justify-center gap-2 rounded-lg bg-error px-4 py-2.5 text-sm font-sansBold text-white hover:opacity-90 disabled:opacity-50"
					>
						{ban.isPending ? (
							<Loader2 size={16} className="animate-spin" />
						) : null}
						Banir conta
					</button>
				</div>
			</Modal>
		</div>
	);
}

function Row({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex justify-between gap-4 border-b pb-2 last:border-0">
			<dt className="shrink-0 font-sansMedium text-text-secondary">
				{label}
			</dt>
			<dd className="text-right break-all">{value}</dd>
		</div>
	);
}
