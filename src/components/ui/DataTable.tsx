import { useState } from 'react';
import { ChevronUp, ChevronDown, SearchX } from 'lucide-react';

export interface Column<T> {
	key: string;
	label: string;
	sortable?: boolean;
	render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
	columns: Column<T>[];
	data: T[];
	loading?: boolean;
	onRowClick?: (item: T) => void;
	emptyMessage?: string;
}

function SkeletonRow({ cols }: { cols: number }) {
	return (
		<tr className="animate-skeleton">
			{Array.from({ length: cols }).map((_, i) => (
				<td key={i} className="px-4 py-3">
					<div className="h-4 w-full rounded bg-border/50" />
				</td>
			))}
		</tr>
	);
}

export function DataTable<T extends Record<string, any>>({
	columns,
	data,
	loading,
	onRowClick,
	emptyMessage = 'Nenhum registo encontrado.',
}: DataTableProps<T>) {
	const [sortKey, setSortKey] = useState<string | null>(null);
	const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

	const handleSort = (key: string) => {
		if (sortKey === key) {
			setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
		} else {
			setSortKey(key);
			setSortDir('asc');
		}
	};

	const sorted = [...data].sort((a, b) => {
		if (!sortKey) return 0;
		const aVal = a[sortKey];
		const bVal = b[sortKey];
		if (aVal == null) return 1;
		if (bVal == null) return -1;
		const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
		return sortDir === 'asc' ? cmp : -cmp;
	});

	if (loading) {
		return (
			<div className="overflow-hidden rounded-xl border bg-surface">
				<table className="w-full text-left text-sm">
					<thead className="border-b bg-background/50 text-xs uppercase text-text-secondary">
						<tr>
							{columns.map((col) => (
								<th
									key={col.key}
									className="px-4 py-3 font-medium"
								>
									{col.label}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{Array.from({ length: 5 }).map((_, i) => (
							<SkeletonRow key={i} cols={columns.length} />
						))}
					</tbody>
				</table>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border bg-surface p-12">
				<SearchX size={40} className="text-border" />
				<p className="mt-3 text-sm text-text-secondary">
					{emptyMessage}
				</p>
			</div>
		);
	}

	return (
		<div className="overflow-hidden rounded-xl border bg-surface">
			<div className="overflow-x-auto">
				<table className="w-full text-left text-sm">
					<thead className="border-b bg-background/50 text-xs uppercase text-text-secondary">
						<tr>
							{columns.map((col) => (
								<th
									key={col.key}
									className={`px-4 py-3 font-medium ${
										col.sortable
											? 'cursor-pointer select-none transition-colors hover:text-text'
											: ''
									}`}
									onClick={() =>
										col.sortable && handleSort(col.key)
									}
								>
									<div className="flex items-center gap-1.5">
										{col.label}
										{col.sortable &&
											sortKey === col.key && (
												<span className="text-primary">
													{sortDir === 'asc' ? (
														<ChevronUp size={14} />
													) : (
														<ChevronDown
															size={14}
														/>
													)}
												</span>
											)}
									</div>
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-border">
						{sorted.map((item, i) => (
							<tr
								key={item.id ?? i}
								className={`${
									onRowClick ? 'cursor-pointer' : ''
								} transition-colors hover:bg-background/40 ${
									i === 0 ? '' : ''
								}`}
								onClick={() => onRowClick?.(item)}
							>
								{columns.map((col) => (
									<td key={col.key} className="px-4 py-3">
										{col.render
											? col.render(item)
											: (item[col.key] ?? '—')}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
