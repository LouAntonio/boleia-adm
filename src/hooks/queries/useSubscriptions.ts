import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';

export function useSubscriptions(params?: Record<string, any>) {
	return useQuery({
		queryKey: ['subscriptions', params],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/subscriptions', {
				params,
			});
			return data.data;
		},
	});
}
