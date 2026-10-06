import { SearchInput } from './SearchInput';

interface SelectFilter {
	key: string;
	label: string;
	options: { label: string; value: string }[];
}

interface FilterBarProps {
	placeholder?: string;
	onSearch?: (value: string) => void;
	selectFilters?: SelectFilter[];
	filterValues?: Record<string, string | undefined>;
	onFilterChange?: (key: string, value: string | undefined) => void;
}

export function FilterBar({
	placeholder,
	onSearch,
	selectFilters,
	filterValues = {},
	onFilterChange,
}: FilterBarProps) {
	return (
		<div className="mb-4 flex flex-wrap items-end gap-3">
			{onSearch && (
				<div className="min-w-[200px] max-w-xs flex-1">
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						Pesquisar
					</label>
					<SearchInput
						onSearch={onSearch}
						placeholder={placeholder}
					/>
				</div>
			)}
			{selectFilters?.map((filter) => (
				<div key={filter.key} className="min-w-[140px]">
					<label className="mb-1 block text-xs font-medium text-text-secondary">
						{filter.label}
					</label>
					<select
						value={filterValues[filter.key] ?? ''}
						onChange={(e) =>
							onFilterChange?.(
								filter.key,
								e.target.value || undefined,
							)
						}
						className="w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-primary"
					>
						<option value="">Todos</option>
						{filter.options.map((opt) => (
							<option key={opt.value} value={opt.value}>
								{opt.label}
							</option>
						))}
					</select>
				</div>
			))}
		</div>
	);
}
