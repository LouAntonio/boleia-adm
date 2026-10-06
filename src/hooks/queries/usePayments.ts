import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../lib/axios';

export function usePayments(params?: Record<string, any>) {
	return useQuery({
		queryKey: ['payments', params],
		queryFn: async () => {
			const { data } = await apiClient.get('/api/admin/payments', {
				params,
			});
			return data.data;
		},
	});
}

export function usePayment(id: string) {
	return useQuery({
		queryKey: ['payments', id],
		queryFn: async () => {
			const { data } = await apiClient.get(`/api/admin/payments/${id}`);
			return data.data;
		},
		enabled: !!id,
	});
}

export function useValidatePayment() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			id,
			payload,
		}: {
			id: string;
			payload: { approved: boolean; reason?: string };
		}) => {
			const { data } = await apiClient.post(
				`/api/admin/payments/${id}/validate`,
				payload,
			);
			return data;
		},
		onSuccess: (_data, variables) => {
			queryClient.invalidateQueries({ queryKey: ['payments'] });
			queryClient.invalidateQueries({
				queryKey: ['payments', variables.id],
			});
		},
	});
}

export function downloadBlobResponse(
	res: {
		data: Blob;
		headers: Record<string, any>;
	},
	fallbackName = 'kuzuela-relatorio-financeiro',
) {
	const url = URL.createObjectURL(res.data);
	const a = document.createElement('a');
	a.href = url;
	const cd: string | undefined =
		res.headers?.['content-disposition'] ??
		res.headers?.get?.('content-disposition');
	const match = cd?.match(/filename="?([^";]+)"?/);
	a.download = match?.[1] ?? fallbackName;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

export function useEmailPaymentReport() {
	return useMutation({
		mutationFn: async (payload: {
			email?: string;
			startDate?: string;
			endDate?: string;
		}) => {
			const { data } = await apiClient.post(
				'/api/admin/payments/report/email',
				payload,
				{ timeout: 120000 },
			);
			return data.data as { message: string };
		},
	});
}
