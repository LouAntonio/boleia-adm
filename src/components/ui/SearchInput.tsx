import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchInputProps {
	onSearch: (val: string) => void;
	placeholder?: string;
}

export function SearchInput({
	onSearch,
	placeholder = 'Pesquisar...',
}: SearchInputProps) {
	const [value, setValue] = useState('');

	const handleSubmit = () => {
		onSearch(value);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') {
			handleSubmit();
		}
	};

	return (
		<div className="relative">
			<Search
				size={16}
				className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer"
				onClick={handleSubmit}
			/>
			<input
				type="text"
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				className="w-full rounded-lg border bg-surface py-2 pl-9 pr-4 text-sm text-text outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
			/>
		</div>
	);
}
