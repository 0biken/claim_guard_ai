// TanStack Query hooks for data fetching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitClaim, getClaimStatus, getAdminClaims, getAdminAnalytics, ClaimSubmission, ClaimResponse } from './api';

// Claim submission mutation
export const useSubmitClaim = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: ClaimSubmission) => submitClaim(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['claims'] });
        },
    });
};

// Claim status query with polling
export const useClaimStatus = (claimId: string | null, enabled = true) => {
    return useQuery<ClaimResponse>({
        queryKey: ['claim', claimId],
        queryFn: () => getClaimStatus(claimId!),
        enabled: !!claimId && enabled,
        refetchInterval: (data) => {
            // Stop polling when claim is processed
            if (data?.state?.data?.status && data.state.data.status !== 'pending') {
                return false;
            }
            return 2000; // Poll every 2 seconds while pending
        },
    });
};

// Admin claims list
export const useAdminClaims = (status?: string, limit = 50, offset = 0) => {
    return useQuery({
        queryKey: ['admin-claims', status, limit, offset],
        queryFn: () => getAdminClaims(status, limit, offset),
    });
};

// Admin analytics
export const useAdminAnalytics = () => {
    return useQuery({
        queryKey: ['admin-analytics'],
        queryFn: getAdminAnalytics,
        refetchInterval: 30000, // Refresh every 30 seconds
    });
};
