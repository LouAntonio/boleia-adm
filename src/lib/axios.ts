import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { authClient } from './auth-client';
import { useAuthStore } from '../stores/useAuthStore';

const apiClient: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	timeout: 15000,
	headers: { 'Content-Type': 'application/json' },
	/*
	 * A sessão vive num cookie que o servidor plantou no login. O browser
	 * envia-o sozinho em cada pedido quando `withCredentials` está ligado, e o
	 * `AuthGuard` do backend lê-o de lá (`fromNodeHeaders`).
	 *
	 * Já não há `Authorization: Bearer`: o interceptor que punha o token lido do
	 * `localStorage` foi removido. Não é perda de função — o cookie transporta a
	 * mesma sessão — é a condição em que o token deixa de ser legível por
	 * JavaScript, e portanto deixa de ser roubável por um XSS.
	 */
	withCredentials: true,
});

apiClient.interceptors.response.use(
	(res) => res,
	(error) => {
		const status = error?.response?.status;
		const url = error?.config?.url ?? '';

		/*
		 * Um 401 numa rota da aplicação é uma sessão morta. Quem a termina é
		 * o `authClient`, não este ficheiro: é o dono da sessão, e termina-la
		 * aqui deixaria duas autoridades a decidir o mesmo assunto — o
		 * `useSession()` do `Layout` e este interceptor.
		 *
		 * O evento continua a ser emitido para o `Layout`, que é quem sabe
		 * redireccionar para o login com o `replace` certo.
		 */
		if (status === 401 && !url.includes('/api/auth/')) {
			useAuthStore.getState().logout();
			void authClient.signOut().catch(() => {});
			window.dispatchEvent(new CustomEvent('boleia:unauthorised'));
		}

		if (status === 403) {
			// Falta de permissão. Não é o mesmo que estar sem sessão: a sessão
			// continua válida, o utilizador simplesmente não pode ver aquilo.
			window.dispatchEvent(new CustomEvent('boleia:forbidden'));
		}

		return Promise.reject(error);
	},
);

export default apiClient;

/** Mensagem legível a partir de um erro do axios. */
export function apiErrorMessage(error: unknown, fallback: string): string {
	const err = error as {
		response?: { data?: { message?: string | string[] } };
		message?: string;
		code?: string;
	};
	const data = err.response?.data?.message;
	if (Array.isArray(data)) return data.join(' ');
	if (typeof data === 'string' && data.length > 0) return data;
	if (err.code === 'ECONNABORTED') {
		return 'O servidor demorou a responder. Tenta de novo.';
	}
	if (err.message === 'Network Error') {
		return 'Sem ligação ao servidor.';
	}
	return fallback;
}
