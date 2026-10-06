import { useAuthStore } from '../stores/useAuthStore';
import { type AdminRole, isAdminRole } from '../lib/enums';

/**
 * Papéis que podem executar cada acção.
 *
 * Espelham `back/src/auth/permissions.ts`. Não substituem a validação do
 * servidor — esta é a camada que evita mostrar um botão que ia devolver 403 —
 * mas são mantidas em sincronia com o backend porque divergir das duas só
 * produz um painel que promete e o backend recusa.
 */
export const CAPABILITIES = {
	/** Rever KYC e viaturas, banir, revogar sessões. */
	moderate: ['ADMIN', 'MODERATOR'],
	/** Gerir roles, criar e eliminar utilizadores. */
	administerUsers: ['ADMIN'],
	/** Ver tudo, incluindo páginas que o SUPPORT não acede. */
	administer: ['ADMIN'],
} satisfies Record<string, readonly string[]>;

export function useRole(): AdminRole | null {
	const role = useAuthStore((s) => s.user?.role);
	return role && isAdminRole(role) ? role : null;
}

/** `true` se o utilizador actual tem pelo menos um dos papéis indicados. */
export function useCan(capability: keyof typeof CAPABILITIES): boolean {
	const role = useRole();
	if (!role) return false;
	return CAPABILITIES[capability].includes(role);
}

/** Versão não-react, para guards de rota. */
export function can(
	role: string | null | undefined,
	capability: keyof typeof CAPABILITIES,
): boolean {
	if (!role || !isAdminRole(role)) return false;
	return CAPABILITIES[capability].includes(role);
}
