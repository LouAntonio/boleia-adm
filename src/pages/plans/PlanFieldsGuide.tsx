interface GuideItem {
	field: string;
	description: string;
	values?: string;
}

const GUIDE_SECTIONS: { title: string; items: GuideItem[] }[] = [
	{
		title: 'Geral',
		items: [
			{
				field: 'Nome',
				description:
					'Nome do plano apresentado ao utilizador. Tem de ser único.',
			},
			{
				field: 'Preço (KZ)',
				description:
					'Preço do plano em Kwanzas cobrado em cada renovação.',
				values: '≥ 0',
			},
			{
				field: 'Status',
				description:
					'Activo — visível e disponível para compra. Inactivo — oculto para novos clientes, mantém subscrições existentes. Arquivado — descontinuado, apenas histórico.',
				values: 'ACTIVE / INACTIVE / ARCHIVED',
			},
		],
	},
	{
		title: 'Limites de Upload',
		items: [
			{
				field: 'Upload Máx (MB)',
				description:
					'Tamanho máximo por ficheiro de áudio enviado. Vazio = sem limite definido.',
				values: 'número ou vazio (sem limite)',
			},
			{
				field: 'Upload Máx (seg)',
				description: 'Duração máxima do áudio enviado, em segundos.',
				values: 'número ou vazio (sem limite)',
			},
			{
				field: 'Cooldown Upload (min)',
				description:
					'Minutos de espera entre uploads após atingir a quantidade da janela.',
				values: '≥ 0 (0 = sem cooldown)',
			},
			{
				field: 'Uploads por Janela',
				description:
					'Quantidade de uploads permitidos dentro da janela de cooldown.',
				values: '≥ 1',
			},
		],
	},
	{
		title: 'Transcrição em Tempo Real',
		items: [
			{
				field: 'Realtime Máx (seg)',
				description:
					'Duração máxima de cada sessão de transcrição ao vivo.',
				values: 'número ou vazio (sem limite)',
			},
			{
				field: 'Cooldown Realtime (min)',
				description: 'Minutos de espera entre sessões em tempo real.',
				values: '≥ 0 (0 = sem cooldown)',
			},
		],
	},
	{
		title: 'Inteligência Artificial',
		items: [
			{
				field: 'Com IA',
				description:
					'Se activo, o plano permite funcionalidades de IA (resumo, correção, itens de acção).',
				values: 'Sim / Não',
			},
			{
				field: 'IA Máx Requests',
				description:
					'Número de pedidos de IA permitidos por ciclo. Vazio = ilimitado (se Com IA estiver activo).',
				values: 'número ou vazio (ilimitado)',
			},
			{
				field: 'IA Reset (dias)',
				description:
					'Intervalo em dias para renovação do contador de pedidos de IA.',
				values: 'padrão: 30',
			},
		],
	},
];

export function PlanFieldsGuide() {
	return (
		<div className="space-y-4 rounded-lg border bg-surface p-6">
			<h2 className="text-sm font-medium uppercase tracking-wide text-text-secondary">
				Guia de Campos
			</h2>
			{GUIDE_SECTIONS.map((section) => (
				<div key={section.title} className="space-y-2">
					<p className="text-xs font-semibold uppercase text-primary">
						{section.title}
					</p>
					{section.items.map((item) => (
						<div
							key={item.field}
							className="border-b border-border pb-2 last:border-0"
						>
							<p className="text-sm font-medium">{item.field}</p>
							<p className="text-xs text-text-secondary">
								{item.description}
							</p>
							{item.values && (
								<p className="mt-0.5 text-xs text-text-secondary/70 italic">
									Valores: {item.values}
								</p>
							)}
						</div>
					))}
				</div>
			))}
		</div>
	);
}
