import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../lib/axios';
import { useAuthStore } from '../stores/useAuthStore';

interface LoginPayload {
	email: string;
	password: string;
}

export function useLogin() {
	const setAuth = useAuthStore((s) => s.setAuth);
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (payload: LoginPayload) => {
			const { data } = await apiClient.post(
				'/api/admin/auth/login',
				payload,
			);
			return data.data;
		},
		onSuccess: (res) => {
			setAuth(res.token, res.user);
			toast.success('Login bem-sucedido');
			navigate('/');
		},
		onError: (err: any) => {
			const msg = err.response?.data?.message ?? 'Erro ao fazer login';
			toast.error(msg);
		},
	});
}

export function useLogout() {
	const logout = useAuthStore((s) => s.logout);
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async () => {
			try {
				await apiClient.post('/api/auth/sign-out');
			} catch {
				// ignore
			}
		},
		onSettled: () => {
			logout();
			navigate('/login');
		},
	});
}

export function useMe() {
	return useQuery({
		queryKey: ['auth', 'session'],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/auth/session');
			return data;
		},
		retry: false,
	});
}
