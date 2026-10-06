import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	page: number;
	limit: number;
	total: number;
	onPageChange: (page: number) => void;
}

export function Pagination({
	page,
	limit,
	total,
	onPageChange,
}: PaginationProps) {
	const totalPages = Math.ceil(total / limit);
	if (totalPages <= 1) return null;

	const getPageNumbers = () => {
		const pages: number[] = [];
		const maxVisible = 5;
		let start = Math.max(1, page - Math.floor(maxVisible / 2));
		const end = Math.min(totalPages, start + maxVisible - 1);
		if (end - start + 1 < maxVisible) {
			start = Math.max(1, end - maxVisible + 1);
		}
		for (let i = start; i <= end; i++) {
			pages.push(i);
		}
		return pages;
	};

	return (
		<div className="mt-4 flex flex-col items-center justify-between gap-3 text-sm sm:flex-row">
			<p className="text-text-secondary">
				Mostrando {Math.min((page - 1) * limit + 1, total)}–
				{Math.min(page * limit, total)} de {total}
			</p>
			<div className="flex items-center gap-1">
				<button
					disabled={page <= 1}
					onClick={() => onPageChange(page - 1)}
					className="flex h-8 w-8 items-center justify-center rounded-lg border bg-surface text-text-secondary transition-colors hover:bg-background hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronLeft size={16} />
				</button>
				{getPageNumbers().map((p) => (
					<button
						key={p}
						onClick={() => onPageChange(p)}
						className={`flex h-8 min-w-[2rem] items-center justify-center rounded-lg px-2 text-xs font-medium transition-colors ${
							p === page
								? 'bg-primary text-white'
								: 'text-text-secondary hover:bg-background hover:text-text'
						}`}
					>
						{p}
					</button>
				))}
				<button
					disabled={page >= totalPages}
					onClick={() => onPageChange(page + 1)}
					className="flex h-8 w-8 items-center justify-center rounded-lg border bg-surface text-text-secondary transition-colors hover:bg-background hover:text-text disabled:cursor-not-allowed disabled:opacity-30"
				>
					<ChevronRight size={16} />
				</button>
			</div>
		</div>
	);
}
