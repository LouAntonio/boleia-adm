import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../lib/axios';
import { useAuthStore } from '../stores/useAuthStore';
import type { SessionUser } from '../types/admin';

interface LoginPayload {
	email: string;
	password: string;
}

/**
 * Cabeçalho onde o plugin `bearer` do better-auth devolve o token.
 *
 * Não vem no corpo: o `bearer` plugin intercepta o `set-cookie` da sessão e
 * escreve-o também num header de resposta, justamente para clientes que não
 * podem usar cookies. É o mesmo mecanismo que a app móvel usa.
 */
const TOKEN_HEADER = 'set-auth-token';

/** Extrai o token Bearer da resposta, se o servidor o tiver enviado. */
function tokenFrom(headers: unknown): string | null {
	if (!headers || typeof headers !== 'object') return null;
	const value = (headers as Record<string, unknown>)[TOKEN_HEADER];
	if (typeof value === 'string' && value.length > 0) {
		return value;
	}
	// Axios 1.x normaliza os headers para `AxiosHeaders`, que tem `.get()`.
	const get = (headers as { get?: (n: string) => unknown }).get;
	if (typeof get === 'function') {
		const value2 = get.call(headers, TOKEN_HEADER);
		return typeof value2 === 'string' && value2.length > 0 ? value2 : null;
	}
	return null;
}

function sessionUserFrom(raw: unknown): SessionUser {
	const data = (raw ?? {}) as Record<string, unknown>;
	return {
		id: String(data.id ?? ''),
		name: String(data.name ?? ''),
		surname: (data.surname as string | null) ?? null,
		email: String(data.email ?? ''),
		role: String(data.role ?? 'USER'),
		image: (data.image as string | null) ?? null,
		phone: (data.phone as string | null) ?? null,
		emailVerified: Boolean(data.emailVerified),
		createdAt: (data.createdAt as string) ?? '',
	};
}

function errorMessage(error: unknown, fallback: string): string {
	const err = error as {
		response?: { data?: { message?: string } };
		message?: string;
	};
	return err.response?.data?.message ?? err.message ?? fallback;
}

export function useLogin() {
	const setAuth = useAuthStore((s) => s.setAuth);
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: LoginPayload) => {
			const res = await apiClient.post('/api/auth/sign-in/email', {
				email: payload.email,
				password: payload.password,
			});

			const token = tokenFrom(res.headers);
			if (!token) {
				// Sem token não há sessão utilizável. Falhar aqui, em vez de
				// deixar o utilizador "autenticado" sem credencial, é o que
				// evita um painel que carrega e falha em cada pedido.
				throw new Error('O servidor não devolveu um token de sessão.');
			}
			return { token, user: sessionUserFrom(res.data?.user) };
		},
		onSuccess: ({ token, user }) => {
			setAuth(token, user);
			toast.success('Sessão iniciada');
			navigate('/', { replace: true });
		},
		onError: (error: unknown) => {
			toast.error(
				errorMessage(error, 'Não foi possível iniciar sessão.'),
			);
		},
	});
}

export function useLogout() {
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async () => {
			try {
				await apiClient.post('/api/auth/sign-out');
			} catch {
				// Um logout que falha no servidor não impede o logout local: a
				// sessão pode expirar e o token revogar-se a si próprio.
			}
		},
		onSettled: () => {
			logout();
			// A cache de queries é do utilizador que está a sair. Mantê-la
			// mostraria os dados da conta anterior ao próximo que entrar.
			queryClient.clear();
			navigate('/login', { replace: true });
		},
	});
}

/**
 * Sessão actual, revalidada do servidor.
 *
 * O role que o store tem em cache serve para pintar o menu sem um salto de
 * loading; esta query é quem confirma que a sessão continua válida e trago o
 * role a sério. Uma divergência entre os dois é sinal de que o token caducou
 * ou de que o role mudou do lado do servidor.
 */
export function useMe() {
	return useQuery({
		queryKey: ['auth', 'session'],
		queryFn: async () => {
			const res = await apiClient.get('/api/auth/get-session');
			return sessionUserFrom(res.data?.user);
		},
		retry: false,
		// Um `USER` normal também tem sessão; o 403 aqui não é um erro, é a
		// resposta correcta a alguém que não é administrador.
		enabled: useAuthStore.getState().isAuthenticated(),
	});
}
