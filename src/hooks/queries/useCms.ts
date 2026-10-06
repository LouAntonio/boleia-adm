import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';
import toast from 'react-hot-toast';

export function useCms() {
	return useQuery({
		queryKey: ['cms'],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/cms');
			return data.data;
		},
	});
}

export function useUpdateCms() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: async (payload: any) => {
			const { data } = await apiClient.put('/api/admin/cms', payload);
			return data.data;
		},
		onSuccess: () => {
			qc.invalidateQueries({ queryKey: ['cms'] });
			toast.success('CMS atualizado');
		},
		onError: (err: any) =>
			toast.error(err.response?.data?.message ?? 'Erro ao atualizar CMS'),
	});
}
