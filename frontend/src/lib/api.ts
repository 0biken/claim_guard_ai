// Frontend API client for ClaimGuard AI
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Type definitions
export interface DamageAssessment {
    damage_type: string;
    severity: 'minor' | 'moderate' | 'severe';
    estimated_cost_ngn: number;
    damaged_items: string[];
    confidence: number;
    reasoning: string;
}

export interface ClaimResponse {
    claim_id: string;
    status: 'pending' | 'approved' | 'under_review' | 'rejected';
    damage_assessment?: DamageAssessment;
    fraud_score: number;
    decision?: string;
    approved_amount?: number;
    reason?: string;
    flags: string[];
    next_steps?: string;
}

export interface ClaimSubmission {
    policy_number: string;
    claim_type: 'motor' | 'property' | 'health';
    incident_date: string;
    description: string;
    images: File[];
}

// API functions
export const submitClaim = async (data: ClaimSubmission): Promise<{ claim_id: string }> => {
    const formData = new FormData();
    formData.append('policy_number', data.policy_number);
    formData.append('claim_type', data.claim_type);
    formData.append('incident_date', data.incident_date);
    formData.append('description', data.description);

    data.images.forEach((image) => {
        formData.append('images', image);
    });

    const response = await api.post('/api/v1/claims/submit', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });

    return response.data;
};

export const getClaimStatus = async (claimId: string): Promise<ClaimResponse> => {
    const response = await api.get(`/api/v1/claims/${claimId}/status`);
    return response.data;
};

export const getAdminClaims = async (status?: string, limit = 50, offset = 0) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    const response = await api.get(`/api/v1/admin/claims?${params}`);
    return response.data;
};

export const getAdminAnalytics = async () => {
    const response = await api.get('/api/v1/admin/analytics');
    return response.data;
};
