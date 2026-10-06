import { useQuery } from '@tanstack/react-query';
import apiClient from '../../lib/axios';

export function useAuditLogs(params?: Record<string, any>) {
	return useQuery({
		queryKey: ['audit-logs', params],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/audit-logs', {
				params,
			});
			return data.data;
		},
	});
}
