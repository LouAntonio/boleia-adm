import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import toast from 'react-hot-toast';

export function usePlans() {
	return useQuery({
		queryKey: ['plans'],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/plans');
			return data.data;
		},
	});
}

export function usePlan(id: string) {
	return useQuery({
		queryKey: ['plans', id],
		queryFn: async () => {
			const { data } = await apiClient.get(`/api/admin/plans`);
			const plans = data.data ?? [];
			return plans.find((p: any) => p.id === id) ?? null;
		},
		enabled: !!id,
	});
}

export function useCreatePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: any) => {
			const { data } = await apiClient.post('/api/admin/plans', payload);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['plans'] });
			toast.success('Plano criado');
		},
		onError: (err: any) =>
			toast.error(err.response?.data?.message ?? 'Erro ao criar plano'),
	});
}

export function useUpdatePlan() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async ({
			id,
			...payload
		}: {
			id: string;
			[key: string]: any;
		}) => {
			const { data } = await apiClient.put(
				`/api/admin/plans/${id}`,
				payload,
			);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['plans'] });
			toast.success('Plano atualizado');
		},
		onError: (err: any) =>
			toast.error(err.response?.data?.message ?? 'Erro ao atualizar'),
	});
}
