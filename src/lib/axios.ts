import axios from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const apiClient: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
	timeout: 15000,
	headers: { 'Content-Type': 'application/json' },
	withCredentials: true,
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
	const token = useAuthStore.getState().token;
	if (token) {
		config.headers.set('Authorization', `Bearer ${token}`);
	}
	return config;
});

apiClient.interceptors.response.use(
	(res) => res,
	(error) => {
		if (error.response?.status === 401) {
			const url = error.config?.url ?? '';
			if (!url.includes('/auth/')) {
				useAuthStore.getState().logout();
				window.location.href = '/login';
			}
		}
		return Promise.reject(error);
	},
);

export default apiClient;
