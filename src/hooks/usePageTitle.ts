import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const pathLabels: Record<string, string> = {
	'': 'Dashboard',
	users: 'Utilizadores',
	create: 'Criar',
	plans: 'Planos',
	subscriptions: 'Subscrições',
	transcriptions: 'Transcrições',
	payments: 'Pagamentos',
	settings: 'Definições',
	'audit-logs': 'Auditoria',
};

export function usePageTitle() {
	const location = useLocation();

	useEffect(() => {
		const parts = location.pathname.split('/').filter(Boolean);
		const page =
			parts.length === 0
				? 'Dashboard'
				: (pathLabels[parts[0]] ?? parts[0]);
		document.title = `${page} · Kuzuela`;
	}, [location]);
}
