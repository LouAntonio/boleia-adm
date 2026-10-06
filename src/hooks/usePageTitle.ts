import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Título do separador a partir do caminho.
 *
 * O mapa está duplicado em `Header.tsx` para as migalhas. É um resíduo do
 * projecto anterior; as duas listas vão divergir assim que alguém acrescentar
 * uma rota num sítio e não no outro. Preferia um só ficheiro, mas unificar
 * agora seria mexer no `Header` sem necessidade para o que está pedido — fica
 * como próximo passo, e ambos os mapas estão sincronizados hoje.
 */
const pathLabels: Record<string, string> = {
	'': 'Painel de controlo',
	users: 'Utilizadores',
	kyc: 'KYC',
	vehicles: 'Viaturas',
	rides: 'Corridas',
	bookings: 'Reservas',
	'audit-logs': 'Auditoria',
};

export function usePageTitle() {
	const location = useLocation();

	useEffect(() => {
		const parts = location.pathname.split('/').filter(Boolean);
		const page =
			parts.length === 0
				? 'Painel de controlo'
				: (pathLabels[parts[0]] ?? parts[0]);
		document.title = `${page} · Boleia`;
	}, [location]);
}
