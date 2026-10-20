import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import type { MediaView } from '../../types/admin';

interface ImageGalleryProps {
	images: MediaView[];
	emptyMessage?: string;
}

/**
 * Grelha de documentos com visualizador.
 *
 * O Cloudinary já entrega uma miniatura de 400×400, por isso a grelha não
 * descarrega os originais. Abrir uma imagem não navega para fora do painel:
 * a URL do original é assinada e expira em 15 minutos, e um link aberto noutro
 * separador perde o contexto do pedido que se está a rever.
 */
export function ImageGallery({
	images,
	emptyMessage = 'Sem fotografias.',
}: ImageGalleryProps) {
	const [active, setActive] = useState<number | null>(null);

	const close = useCallback(() => setActive(null), []);
	const previous = useCallback(
		() =>
			setActive((index) =>
				index === null
					? index
					: (index - 1 + images.length) % images.length,
			),
		[images.length],
	);
	const next = useCallback(
		() =>
			setActive((index) =>
				index === null ? index : (index + 1) % images.length,
			),
		[images.length],
	);

	useEffect(() => {
		if (active === null) return;
		const onKey = (event: KeyboardEvent) => {
			/*
			 * Em captura, para o `Escape` não chegar também ao `Modal`, que
			 * tem o seu próprio listener no `document`: sem isto, fechar a
			 * fotografia fechava a ficha inteira.
			 */
			event.stopPropagation();
			if (event.key === 'Escape') close();
			if (event.key === 'ArrowLeft') previous();
			if (event.key === 'ArrowRight') next();
		};
		window.addEventListener('keydown', onKey, true);
		return () => window.removeEventListener('keydown', onKey, true);
	}, [active, close, previous, next]);

	if (images.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-background p-8 text-text-secondary">
				<ImageOff size={28} />
				<p className="mt-2 text-sm">{emptyMessage}</p>
			</div>
		);
	}

	const current = active === null ? null : images[active];

	return (
		<>
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{images.map((image, index) => (
					<button
						key={image.id}
						type="button"
						onClick={() => setActive(index)}
						className="group relative overflow-hidden rounded-lg border bg-background text-left transition-shadow hover:shadow-md"
					>
						<img
							src={image.thumbnailUrl}
							alt={image.label ?? 'Documento'}
							loading="lazy"
							className="h-32 w-full object-cover"
						/>
						<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 pb-1.5 pt-5 text-xs font-medium text-white">
							{image.label ?? 'Documento'}
						</span>
					</button>
				))}
			</div>

			{current
				? createPortal(
						<div
							className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/85 p-4"
							onClick={(event) =>
								event.target === event.currentTarget && close()
							}
						>
							<div className="mb-3 flex w-full max-w-4xl items-center justify-between gap-3 text-white">
								<div>
									<p className="text-sm font-medium">
										{current.label ?? 'Documento'}
									</p>
									<p className="text-xs text-white/60">
										{active! + 1} de {images.length}
									</p>
								</div>
								<div className="flex items-center gap-2">
									<a
										href={current.url}
										target="_blank"
										rel="noreferrer"
										className="rounded-md border border-white/30 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
									>
										Abrir original
									</a>
									<button
										type="button"
										onClick={close}
										className="flex h-9 w-9 items-center justify-center rounded-md border border-white/30 text-white/80 hover:bg-white/10"
										aria-label="Fechar"
									>
										<X size={18} />
									</button>
								</div>
							</div>

							<div className="relative flex w-full max-w-4xl items-center justify-center">
								{images.length > 1 ? (
									<button
										type="button"
										onClick={previous}
										className="absolute left-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
										aria-label="Anterior"
									>
										<ChevronLeft size={22} />
									</button>
								) : null}
								<img
									src={current.url}
									alt={current.label ?? 'Documento'}
									className="max-h-[78vh] w-auto max-w-full rounded-lg object-contain"
								/>
								{images.length > 1 ? (
									<button
										type="button"
										onClick={next}
										className="absolute right-0 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
										aria-label="Seguinte"
									>
										<ChevronRight size={22} />
									</button>
								) : null}
							</div>
						</div>,
						document.body,
					)
				: null}
		</>
	);
}
