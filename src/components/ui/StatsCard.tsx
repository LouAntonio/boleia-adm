import { useEffect, useState } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
	label: string;
	value: string | number;
	subtitle?: string;
	icon: LucideIcon;
	trend?: { value: number; positive: boolean };
	delay?: number;
}

export function StatsCard({
	label,
	value,
	subtitle,
	icon: Icon,
	trend,
	delay = 0,
}: StatsCardProps) {
	const [displayValue, setDisplayValue] = useState(0);
	const numericValue =
		typeof value === 'number' ? value : parseInt(value as string, 10) || 0;

	useEffect(() => {
		const timer = setTimeout(() => {
			let start = 0;
			const end = numericValue;
			const duration = 800;
			const stepTime = 16;
			const steps = duration / stepTime;
			const increment = end / steps;

			const interval = setInterval(() => {
				start += increment;
				if (start >= end) {
					setDisplayValue(end);
					clearInterval(interval);
				} else {
					setDisplayValue(Math.floor(start));
				}
			}, stepTime);

			return () => clearInterval(interval);
		}, delay);

		return () => clearTimeout(timer);
	}, [numericValue, delay]);

	return (
		<div
			className="animate-count-up relative overflow-hidden rounded-xl border bg-surface p-5 shadow-card transition-all duration-200 hover:shadow-elevated"
			style={{ animationDelay: `${delay}ms` }}
		>
			<div className="flex items-start justify-between">
				<div className="space-y-1.5">
					<p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
						{label}
					</p>
					<p className="font-bold font-display text-2xl text-text tabular-nums">
						{typeof value === 'number'
							? displayValue.toLocaleString()
							: value}
					</p>
					{subtitle && (
						<p className="text-xs text-text-secondary/70">
							{subtitle}
						</p>
					)}
				</div>
				<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
					<Icon size={20} />
				</div>
			</div>
			{trend && (
				<div className="mt-3 flex items-center gap-1.5 border-t border-border pt-3">
					<span
						className={`inline-flex items-center gap-0.5 text-xs font-medium ${
							trend.positive ? 'text-success' : 'text-error'
						}`}
					>
						{trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
					</span>
					<span className="text-xs text-text-secondary">
						vs. período anterior
					</span>
				</div>
			)}
		</div>
	);
}
