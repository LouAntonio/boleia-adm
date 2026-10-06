import { useParams, useNavigate } from 'react-router-dom';
import { useTranscription } from '../../hooks/queries/useTranscriptions';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { format } from 'date-fns';
import {
	enumLabel,
	TRANSCRIPTION_STATUS_LABELS,
	TRANSCRIPTION_TYPE_LABELS,
	LANGUAGE_LABELS,
	AI_STATUS_LABELS,
} from '../../lib/enums';

export function TranscriptionDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: t, isLoading } = useTranscription(id!);

	if (isLoading) return <p className="text-text-secondary">A carregar...</p>;
	if (!t) return <p className="text-error">Transcrição não encontrada.</p>;

	return (
		<div>
			<PageHeader
				title={`Transcrição #${t.id.slice(0, 8)}`}
				subtitle={`Criada em ${format(new Date(t.createdAt), 'dd/MM/yyyy HH:mm')}`}
				actions={
					<button
						onClick={() => navigate('/transcriptions')}
						className="rounded-lg border bg-background px-4 py-2 text-sm"
					>
						Voltar
					</button>
				}
			/>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="rounded-lg border bg-surface p-5 space-y-3">
					<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
						Detalhes da Transcrição
					</h2>
					<DetailRow
						label="Estado"
						value={
							<StatusBadge
								status={t.status}
								variant={
									t.status === 'DONE'
										? 'success'
										: t.status === 'FAILED'
											? 'error'
											: 'warning'
								}
								label={enumLabel(
									TRANSCRIPTION_STATUS_LABELS,
									t.status,
								)}
							/>
						}
					/>
					<DetailRow
						label="Tipo"
						value={
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
						}
					/>
					<DetailRow
						label="Idioma"
						value={enumLabel(LANGUAGE_LABELS, t.language)}
					/>
					<DetailRow
						label="Duração"
						value={t.duration ? `${t.duration}s` : '—'}
					/>
					{t.audioSize && (
						<DetailRow
							label="Tamanho Áudio"
							value={`${(t.audioSize / 1024 / 1024).toFixed(2)} MB`}
						/>
					)}
					{t.mimeType && (
						<DetailRow label="Formato" value={t.mimeType} />
					)}
					<DetailRow
						label="IA Status"
						value={
							<StatusBadge
								status={t.aiStatus}
								variant={
									t.aiStatus === 'COMPLETED'
										? 'success'
										: t.aiStatus === 'PROCESSING'
											? 'warning'
											: t.aiStatus === 'FAILED'
												? 'error'
												: 'neutral'
								}
								label={enumLabel(AI_STATUS_LABELS, t.aiStatus)}
							/>
						}
					/>
				</div>

				<div className="rounded-lg border bg-surface p-5 space-y-3">
					<h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide">
						Utilizador &amp; Pasta
					</h2>
					{t.user ? (
						<>
							<DetailRow label="Nome" value={t.user.name} />
							<DetailRow label="Email" value={t.user.email} />
						</>
					) : (
						<DetailRow label="Nome" value="—" />
					)}
					<DetailRow label="Pasta" value={t.folder?.name ?? '—'} />
				</div>
			</div>
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
