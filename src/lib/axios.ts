import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const apiClient: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	timeout: 15000,
	headers: { 'Content-Type': 'application/json' },
	// O backend devolve a sessão em cookie e o painel faz login por email. Sem
	// isto o browser não guarda o cookie e o `get-session` volta vazio depois
	// de recarregar a página.
	withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	return config;
});

/**
 * Rotas em que um 401 é mensagem de formulário e não sessão morta.
 *
 * A exclusão anterior era `!url.includes('/api/auth/')`, o que protectava o
 * login às cegas — e também `list-users`, `get-user`, `set-role`, `ban-user` e
 * `unban-user`, que vivem em `/api/auth/admin/*`. Um token expirado numa
 * dessas devolvia 401 sem nunca limpar a store nem emitir o evento: o
 * operador ficava com um painel "autenticado" cujas listas davam sempre
 * vazio, sem qualquer indicação de que a sessão tinha morrido.
 *
 * A lista é explícita de propósito: o que não entra aqui, trata o 401 como
 * o que é.
 */
const FORM_LEVEL_401 = ['/api/auth/sign-in', '/api/auth/sign-up'];

function isAuthFormRequest(url: string): boolean {
	return FORM_LEVEL_401.some((path) => url.includes(path));
}

apiClient.interceptors.response.use(
	(res) => res,
	(error) => {
		const status = error?.response?.status;
		const url = error?.config?.url ?? '';

		if (status === 401 && !isAuthFormRequest(url)) {
			// A sessão expirou ou foi revogada. Um `window.location.href`
			// descartava o estado do router e recarregava a aplicação inteira;
			// um evento é mais limpo e deixa o `Login` tratar do redireccionamento.
			useAuthStore.getState().logout();
			window.dispatchEvent(new CustomEvent('boleia:unauthorised'));
		}

		if (status === 403) {
			// Falta de permissão. Não é o mesmo que estar sem sessão: o token
			// continua válido, o utilizador simplesmente não pode ver aquilo.
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
