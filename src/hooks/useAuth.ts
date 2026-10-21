import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authClient, authErrorMessage } from '../lib/auth-client';
import { useAuthStore } from '../stores/useAuthStore';

interface LoginPayload {
	email: string;
	password: string;
}

/**
 * Erro de uma operação de autenticação, já com a mensagem do servidor.
 *
 * Existe para os ecrãs de auth mostrarem o que o backend disse em vez do texto de
 * fallback. A alternativa — atirar o erro cru do `better-fetch` — é pior:
 * quem o recebe não conhece a forma `{ error: { message } }` e acaba por
 * mostrar o fallback numa falha que o servidor já tinha explicado.
 */
export class AuthRequestError extends Error {
	readonly status?: number;
	constructor(message: string, status?: number) {
		super(message);
		this.name = 'AuthRequestError';
		this.status = status;
	}
}

/** Lê a mensagem de um erro, seja do `authClient` ou de um `Error` nosso. */
export function authMessage(error: unknown, fallback: string): string {
	if (error instanceof AuthRequestError) return error.message;
	return authErrorMessage(error) ?? fallback;
}

export function useLogin() {
	const navigate = useNavigate();
	const logout = useAuthStore((s) => s.logout);
	/*
	 * O better-auth avisa o atom da sessão com um pequeno atraso depois do
	 * `signIn.email`. Se navegássemos já, o `Layout` lia o `null` antigo e
	 * mandava a pessoa para `/login`; o refresh é que a trazia de volta. Este
	 * refetch explícito fecha essa janela.
	 */
	const { refetch: refetchSession } = authClient.useSession();

	return useMutation({
		mutationFn: async (payload: LoginPayload) => {
			const { error } = await authClient.signIn.email({
				email: payload.email,
				password: payload.password,
				/*
				 * Desliga o refetch automático. O sinal dele é agendado uns
				 * milissegundos depois e cancelaria o nosso, deixando a
				 * navegação à frente da resposta.
				 */
				fetchOptions: { disableSignal: true },
			});
			if (error) {
				throw new AuthRequestError(
					authErrorMessage(error) ?? 'Credenciais inválidas.',
					(error as { statusCode?: number }).statusCode,
				);
			}
			// Sem sessão não há painel. O `Layout` lê a sessão do `authClient`, e
			// este era o token guardado em `localStorage`.
			logout();
			await refetchSession();
			return true;
		},
		onSuccess: () => {
			toast.success('Sessão iniciada');
			navigate('/', { replace: true });
		},
		onError: (error: unknown) => {
			toast.error(authMessage(error, 'Não foi possível iniciar sessão.'));
		},
	});
}

export function useLogout() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const logout = useAuthStore((s) => s.logout);

	return useMutation({
		mutationFn: async () => {
			try {
				await authClient.signOut();
			} catch {
				// Um logout que falha no servidor não impede o logout local: a
				// sessão pode ter expirado e revogado-se a si próprio.
			}
		},
		onSettled: () => {
			logout();
			// A cache de queries é do utilizador que está a sair. Mantê-la
			// mostraria os dados da conta anterior ao próximo que entrar.
			// A sessão não está nesta cache — vive no `authClient`, que já a
			// revogou no `signOut` acima.
			queryClient.clear();
			navigate('/login', { replace: true });
		},
	});
}
