import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';

export function useTranscriptions(params?: Record<string, any>) {
	return useQuery({
		queryKey: ['transcriptions', params],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/transcriptions', {
				params,
			});
			return data.data;
		},
	});
}

export function useTranscription(id: string) {
	return useQuery({
		queryKey: ['transcriptions', id],
		queryFn: async () => {
			const { data } = await apiClient.get(
				`/api/admin/transcriptions/${id}`,
			);
			return data.data;
		},
		enabled: !!id,
	});
}
