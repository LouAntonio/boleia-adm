import { useState, useEffect } from 'react';
import { useCms, useUpdateCms } from '../../hooks/queries/useCms';
import { PageHeader } from '../../components/ui/PageHeader';

export function CmsPage() {
	const { data: cms, isLoading } = useCms();
	const updateCms = useUpdateCms();

	const [form, setForm] = useState({
		aboutHtml: '',
		termsHtml: '',
		supportContact: '',
		maintenanceMode: false,
	});

	useEffect(() => {
		if (cms) {
			setForm({
				aboutHtml: cms.aboutHtml ?? '',
				termsHtml: cms.termsHtml ?? '',
				supportContact: cms.supportContact ?? '',
				maintenanceMode: cms.maintenanceMode ?? false,
			});
		}
	}, [cms]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateCms.mutate(form);
	};

	if (isLoading) {
		return <p className="text-text-secondary">A carregar...</p>;
	}

	return (
		<div>
			<PageHeader
				title="Definições"
				subtitle="Conteúdos estáticos da plataforma"
			/>

			<form
				onSubmit={handleSubmit}
				className="max-w-2xl space-y-6 rounded-lg border bg-surface p-6"
			>
				<div>
					<label className="block text-sm font-medium mb-1">
						Suporte (Contacto)
					</label>
					<input
						value={form.supportContact}
						onChange={(e) =>
							setForm({
								...form,
								supportContact: e.target.value,
							})
						}
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm outline-none focus:border-primary"
						placeholder="suporte@kuzuela.co.ao"
					/>
				</div>

				<div>
					<label className="flex items-center gap-2 mb-3">
						<input
							type="checkbox"
							checked={form.maintenanceMode}
							onChange={(e) =>
								setForm({
									...form,
									maintenanceMode: e.target.checked,
								})
							}
							className="rounded border-border"
						/>
						<span className="text-sm font-medium">
							Modo de Manutenção
						</span>
					</label>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Sobre (HTML)
					</label>
					<textarea
						value={form.aboutHtml}
						onChange={(e) =>
							setForm({ ...form, aboutHtml: e.target.value })
						}
						rows={8}
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm font-mono outline-none focus:border-primary"
						placeholder="<h1>Sobre a Kuzuela</h1><p>...</p>"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium mb-1">
						Termos & Condições (HTML)
					</label>
					<textarea
						value={form.termsHtml}
						onChange={(e) =>
							setForm({ ...form, termsHtml: e.target.value })
						}
						rows={8}
						className="w-full rounded-lg border bg-surface px-4 py-2 text-sm font-mono outline-none focus:border-primary"
						placeholder="<h1>Termos e Condições</h1><p>...</p>"
					/>
				</div>

				<div className="flex gap-3">
					<button
						type="submit"
						disabled={updateCms.isPending}
						className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
					>
						{updateCms.isPending ? 'A salvar...' : 'Salvar'}
					</button>
				</div>
			</form>
		</div>
	);
}
