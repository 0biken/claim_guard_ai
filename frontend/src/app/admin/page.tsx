'use client';

import Link from 'next/link';
import { Shield, ArrowLeft, Activity, AlertTriangle, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminClaims, useAdminAnalytics } from '@/lib/queries';

const STATUS_COLORS = {
    pending: 'bg-gray-100 text-gray-800',
    approved: 'bg-green-100 text-green-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    rejected: 'bg-red-100 text-red-800',
};

export default function AdminPage() {
    const { data: claims, isLoading: claimsLoading, refetch: refetchClaims } = useAdminClaims();
    const { data: analytics, isLoading: analyticsLoading, refetch: refetchAnalytics } = useAdminAnalytics();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const refreshAll = () => {
        refetchClaims();
        refetchAnalytics();
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header */}
            <header className="bg-white border-b shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center gap-2">
                            <Shield className="w-8 h-8 text-teal-600" />
                            <span className="text-xl font-bold text-gray-900">ClaimGuard AI</span>
                            <Badge variant="outline" className="ml-2">Admin</Badge>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" onClick={refreshAll}>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {analyticsLoading ? (
                        Array(4).fill(0).map((_, i) => (
                            <Card key={i}>
                                <CardContent className="p-6">
                                    <Skeleton className="h-4 w-20 mb-2" />
                                    <Skeleton className="h-8 w-16" />
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Activity className="w-4 h-4" />
                                        <span className="text-sm">Claims Today</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {analytics?.claims_today || 0}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-sm">Avg Processing</span>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {analytics?.avg_processing_time_seconds
                                            ? `${Math.round(analytics.avg_processing_time_seconds)}s`
                                            : '--'}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span className="text-sm">Fraud Detected</span>
                                    </div>
                                    <p className="text-3xl font-bold text-red-600">
                                        {analytics?.fraud_detected_count || 0}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm">Approval Rate</span>
                                    </div>
                                    <p className="text-3xl font-bold text-green-600">
                                        {analytics?.approval_rate
                                            ? `${Math.round(analytics.approval_rate)}%`
                                            : '--'}
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Claims Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Claims</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {claimsLoading ? (
                            <div className="space-y-4">
                                {Array(5).fill(0).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full" />
                                ))}
                            </div>
                        ) : claims?.claims?.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No claims yet. Submit your first claim to see it here.</p>
                                <Link href="/submit">
                                    <Button className="mt-4">Submit a Claim</Button>
                                </Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="text-left text-sm text-gray-500 border-b">
                                            <th className="pb-3 font-medium">Claim ID</th>
                                            <th className="pb-3 font-medium">Policy</th>
                                            <th className="pb-3 font-medium">Type</th>
                                            <th className="pb-3 font-medium">Status</th>
                                            <th className="pb-3 font-medium">Amount</th>
                                            <th className="pb-3 font-medium">Fraud Score</th>
                                            <th className="pb-3 font-medium">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {claims?.claims?.map((claim: any) => (
                                            <tr key={claim.claim_id} className="border-b last:border-0">
                                                <td className="py-4 font-mono text-sm">
                                                    {claim.claim_id.slice(0, 8)}...
                                                </td>
                                                <td className="py-4">{claim.policy_number}</td>
                                                <td className="py-4 capitalize">{claim.claim_type}</td>
                                                <td className="py-4">
                                                    <Badge className={STATUS_COLORS[claim.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}>
                                                        {claim.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-4">{formatCurrency(claim.estimated_amount)}</td>
                                                <td className="py-4">
                                                    <span className={
                                                        claim.fraud_score <= 30 ? 'text-green-600' :
                                                            claim.fraud_score <= 70 ? 'text-yellow-600' :
                                                                'text-red-600'
                                                    }>
                                                        {claim.fraud_score}/100
                                                    </span>
                                                </td>
                                                <td className="py-4 text-sm text-gray-500">
                                                    {new Date(claim.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
