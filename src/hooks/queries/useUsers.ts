import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import toast from 'react-hot-toast';

export function useUsers(params?: Record<string, any>) {
	return useQuery({
		queryKey: ['users', params],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/users', {
				params,
			});
			return data.data;
		},
	});
}

export function useUser(id: string) {
	return useQuery({
		queryKey: ['users', id],
		queryFn: async () => {
			const { data } = await apiClient.get(`/api/admin/users/${id}`);
			return data.data;
		},
		enabled: !!id,
	});
}

export function useCreateUser() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: any) => {
			const { data } = await apiClient.post('/api/admin/users', payload);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['users'] });
			toast.success('Utilizador criado');
		},
		onError: (err: any) =>
			toast.error(err.response?.data?.message ?? 'Erro ao criar'),
	});
}

export function useUpdateUser(id: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: any) => {
			const { data } = await apiClient.patch(
				`/api/admin/users/${id}`,
				payload,
			);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['users'] });
			toast.success('Utilizador atualizado');
		},
		onError: (err: any) =>
			toast.error(err.response?.data?.message ?? 'Erro ao atualizar'),
	});
}

export function useUpdateUserRole() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({ id, role }: { id: string; role: string }) => {
			const { data } = await apiClient.patch(
				`/api/admin/users/${id}/role`,
				{ role },
			);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['users'] });
			toast.success('Role atualizado');
		},
		onError: (err: any) =>
			toast.error(err.response?.data?.message ?? 'Erro'),
	});
}

export function useAssignPlan(userId: string) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: {
			planId: string;
			durationDays?: number;
		}) => {
			const { data } = await apiClient.post(
				`/api/admin/users/${userId}/assign-plan`,
				payload,
			);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['users'] });
			qc.invalidateQueries({ queryKey: ['users', userId] });
			toast.success('Plano atribuído com sucesso');
		},
		onError: (err: any) =>
			toast.error(
				err.response?.data?.message ?? 'Erro ao atribuir plano',
			),
	});
}
