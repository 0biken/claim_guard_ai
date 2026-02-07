'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ProcessingStep {
    id: string;
    label: string;
    status: 'pending' | 'processing' | 'complete' | 'error';
}

interface ProcessingAnimationProps {
    status: 'pending' | 'approved' | 'under_review' | 'rejected';
    fraudScore?: number;
}

const STEPS: ProcessingStep[] = [
    { id: 'upload', label: 'Uploading images', status: 'pending' },
    { id: 'analyze', label: 'AI damage analysis', status: 'pending' },
    { id: 'fraud', label: 'Fraud detection', status: 'pending' },
    { id: 'decision', label: 'Making decision', status: 'pending' },
];

export function ProcessingAnimation({ status, fraudScore }: ProcessingAnimationProps) {
    // Calculate current step based on status
    const getSteps = (): ProcessingStep[] => {
        if (status === 'pending') {
            // Animate through steps
            return STEPS.map((step, i) => ({
                ...step,
                status: i < 2 ? 'complete' : i === 2 ? 'processing' : 'pending',
            }));
        }
        // All complete
        return STEPS.map((step) => ({ ...step, status: 'complete' }));
    };

    const steps = getSteps();
    const progress = status === 'pending' ? 65 : 100;

    return (
        <div className="max-w-md mx-auto py-8">
            {/* Main progress */}
            <div className="text-center mb-8">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mb-4"
                >
                    {status === 'pending' ? (
                        <div className="w-20 h-20 mx-auto rounded-full bg-teal-100 flex items-center justify-center">
                            <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                        </div>
                    ) : status === 'approved' ? (
                        <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                    ) : status === 'under_review' ? (
                        <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center">
                            <Clock className="w-10 h-10 text-yellow-600" />
                        </div>
                    ) : (
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                            <XCircle className="w-10 h-10 text-red-600" />
                        </div>
                    )}
                </motion.div>

                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {status === 'pending' && 'Processing your claim...'}
                    {status === 'approved' && 'Claim Approved! 🎉'}
                    {status === 'under_review' && 'Under Review'}
                    {status === 'rejected' && 'Claim Rejected'}
                </h2>

                <p className="text-gray-500">
                    {status === 'pending' && 'Our AI is analyzing your damage photos'}
                    {status === 'approved' && 'Your claim has been approved for payment'}
                    {status === 'under_review' && 'Additional verification is required'}
                    {status === 'rejected' && 'Fraud indicators were detected'}
                </p>
            </div>

            {/* Progress bar */}
            <div className="mb-8">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-gray-500 text-center mt-2">
                    {status === 'pending' ? `${progress}% complete` : 'Processing complete'}
                </p>
            </div>

            {/* Steps list */}
            <div className="space-y-3">
                <AnimatePresence mode="wait">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={cn(
                                'flex items-center gap-3 p-3 rounded-lg',
                                step.status === 'complete' && 'bg-green-50',
                                step.status === 'processing' && 'bg-teal-50 border border-teal-200',
                                step.status === 'pending' && 'bg-gray-50',
                                step.status === 'error' && 'bg-red-50'
                            )}
                        >
                            {/* Step icon */}
                            <div className="flex-shrink-0">
                                {step.status === 'complete' && (
                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                )}
                                {step.status === 'processing' && (
                                    <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />
                                )}
                                {step.status === 'pending' && (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                )}
                                {step.status === 'error' && (
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                )}
                            </div>

                            {/* Step label */}
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    step.status === 'complete' && 'text-green-700',
                                    step.status === 'processing' && 'text-teal-700',
                                    step.status === 'pending' && 'text-gray-500',
                                    step.status === 'error' && 'text-red-700'
                                )}
                            >
                                {step.label}
                            </span>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Fraud score indicator (hidden during pending) */}
            {status !== 'pending' && fraudScore !== undefined && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-6 p-4 rounded-lg bg-gray-100"
                >
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Score</span>
                        <span
                            className={cn(
                                'font-bold',
                                fraudScore <= 30 && 'text-green-600',
                                fraudScore > 30 && fraudScore <= 70 && 'text-yellow-600',
                                fraudScore > 70 && 'text-red-600'
                            )}
                        >
                            {fraudScore}/100
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
