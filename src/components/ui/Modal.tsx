import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
	open: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
	size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({
	open,
	onClose,
	title,
	children,
	size = 'md',
}: ModalProps) {
	const overlayRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose();
		};
		if (open) {
			document.addEventListener('keydown', handleEsc);
			document.body.style.overflow = 'hidden';
		}
		return () => {
			document.removeEventListener('keydown', handleEsc);
			document.body.style.overflow = '';
		};
	}, [open, onClose]);

	if (!open) return null;

	const sizeClass = {
		sm: 'max-w-sm',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-5xl',
	};

	return (
		<div
			ref={overlayRef}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
			onClick={(e) => e.target === overlayRef.current && onClose()}
		>
			<div
				className={`max-h-[90vh] w-full ${sizeClass[size]} animate-fade-in overflow-y-auto rounded-xl border bg-surface p-6 shadow-elevated`}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-lg font-semibold font-display text-text">
						{title}
					</h2>
					<button
						onClick={onClose}
						className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background hover:text-text"
					>
						<X size={18} />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
