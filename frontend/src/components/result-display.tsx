'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Clock, XCircle, AlertTriangle, ArrowRight, DollarSign, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ClaimResponse } from '@/lib/api';

interface ResultDisplayProps {
    claim: ClaimResponse;
    onNewClaim: () => void;
}

const STATUS_CONFIG = {
    approved: {
        icon: CheckCircle2,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
        title: 'Claim Approved! 🎉',
        description: 'Your claim has been approved for payment.',
    },
    under_review: {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
        title: 'Under Review',
        description: 'Your claim requires additional verification.',
    },
    rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
        title: 'Claim Rejected',
        description: 'We detected issues with this claim.',
    },
    pending: {
        icon: Clock,
        color: 'text-gray-600',
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-800',
        title: 'Processing',
        description: 'Your claim is being processed.',
    },
};

export function ResultDisplay({ claim, onNewClaim }: ResultDisplayProps) {
    const config = STATUS_CONFIG[claim.status];
    const StatusIcon = config.icon;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto space-y-6"
        >
            {/* Status Header */}
            <Card className={cn('border-2', config.border)}>
                <CardContent className={cn('pt-6', config.bg)}>
                    <div className="flex flex-col items-center text-center">
                        <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-4', config.bg)}>
                            <StatusIcon className={cn('w-8 h-8', config.color)} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{config.title}</h2>
                        <p className="text-gray-600 mt-1">{config.description}</p>
                        <Badge className={cn('mt-3', config.badge)}>
                            Claim ID: {claim.claim_id.slice(0, 8)}...
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Damage Assessment */}
            {claim.damage_assessment && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-teal-600" />
                            Damage Assessment
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Damage Type</p>
                                <p className="font-medium">{claim.damage_assessment.damage_type}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Severity</p>
                                <Badge variant={
                                    claim.damage_assessment.severity === 'minor' ? 'secondary' :
                                        claim.damage_assessment.severity === 'moderate' ? 'default' :
                                            'destructive'
                                }>
                                    {claim.damage_assessment.severity}
                                </Badge>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm text-gray-500 mb-2">Damaged Items</p>
                            <div className="flex flex-wrap gap-2">
                                {claim.damage_assessment.damaged_items.map((item, i) => (
                                    <Badge key={i} variant="outline">{item}</Badge>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">AI Reasoning</p>
                            <p className="text-sm mt-1">{claim.damage_assessment.reasoning}</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Financial Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-teal-600" />
                        Financial Summary
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {claim.damage_assessment && (
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Estimated Damage</span>
                                <span className="font-medium">
                                    {formatCurrency(claim.damage_assessment.estimated_cost_ngn)}
                                </span>
                            </div>
                        )}

                        {claim.approved_amount && (
                            <>
                                <Separator />
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-medium text-green-700">Approved Amount</span>
                                    <span className="font-bold text-green-700">
                                        {formatCurrency(claim.approved_amount)}
                                    </span>
                                </div>
                            </>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Fraud Flags (if any) */}
            {claim.flags && claim.flags.length > 0 && (
                <Card className="border-yellow-200 bg-yellow-50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-yellow-700">
                            <AlertTriangle className="w-5 h-5" />
                            Flags Detected
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {claim.flags.map((flag, i) => (
                                <li key={i} className="flex items-start gap-2 text-yellow-800">
                                    <span className="text-yellow-600">•</span>
                                    {flag}
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            )}

            {/* Next Steps */}
            {claim.next_steps && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <ArrowRight className="w-5 h-5 text-teal-600" />
                            <div>
                                <p className="font-medium">Next Steps</p>
                                <p className="text-sm text-gray-600">{claim.next_steps}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* New Claim Button */}
            <div className="text-center pt-4">
                <Button onClick={onNewClaim} size="lg">
                    Submit Another Claim
                </Button>
            </div>
        </motion.div>
    );
}
