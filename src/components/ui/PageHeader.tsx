import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
	title: string;
	subtitle?: string;
	actions?: React.ReactNode;
	icon?: LucideIcon;
}

export function PageHeader({
	title,
	subtitle,
	actions,
	icon: Icon,
}: PageHeaderProps) {
	return (
		<div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
			<div className="flex items-start gap-3">
				{Icon && (
					<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Icon size={20} />
					</div>
				)}
				<div>
					<h1 className="text-xl font-bold font-display text-text">
						{title}
					</h1>
					{subtitle && (
						<p className="mt-0.5 text-sm text-text-secondary">
							{subtitle}
						</p>
					)}
				</div>
			</div>
			{actions && (
				<div className="flex shrink-0 items-center gap-2">
					{actions}
				</div>
			)}
		</div>
	);
}
