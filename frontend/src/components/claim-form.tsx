'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileCheck, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { UploadZone } from './upload-zone';
import { ProcessingAnimation } from './processing-animation';
import { ResultDisplay } from './result-display';

import { claimFormSchema, ClaimFormValues, DEMO_DATA } from '@/lib/validations';
import { useSubmitClaim, useClaimStatus } from '@/lib/queries';

type Step = 'form' | 'processing' | 'result';

export function ClaimForm() {
  const [currentStep, setCurrentStep] = useState<Step>('form');
  const [formStep, setFormStep] = useState(1);
  const [claimId, setClaimId] = useState<string | null>(null);

  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policy_number: '',
      claim_type: undefined,
      incident_date: '',
      description: '',
      images: [],
    },
  });

  const submitClaim = useSubmitClaim();
  const { data: claimStatus } = useClaimStatus(claimId, currentStep === 'processing');

  // Watch for claim completion
  if (claimStatus && claimStatus.status !== 'pending' && currentStep === 'processing') {
    setCurrentStep('result');
  }

  const onSubmit = async (data: ClaimFormValues) => {
    try {
      setCurrentStep('processing');
      const result = await submitClaim.mutateAsync({
        ...data,
        incident_date: new Date(data.incident_date).toISOString(),
      });
      setClaimId(result.claim_id);
      toast.success('Claim submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit claim. Please try again.');
      setCurrentStep('form');
    }
  };

  const fillDemoData = () => {
    form.setValue('policy_number', DEMO_DATA.policy_number || '');
    form.setValue('claim_type', DEMO_DATA.claim_type || 'motor');
    form.setValue('description', DEMO_DATA.description || '');
    form.setValue('incident_date', new Date().toISOString().split('T')[0]);
    toast.success('Demo data filled!');
  };

  const resetForm = () => {
    form.reset();
    setCurrentStep('form');
    setFormStep(1);
    setClaimId(null);
  };

  // Show processing animation
  if (currentStep === 'processing') {
    return (
      <ProcessingAnimation
        status={claimStatus?.status || 'pending'}
        fraudScore={claimStatus?.fraud_score}
      />
    );
  }

  // Show result
  if (currentStep === 'result' && claimStatus) {
    return <ResultDisplay claim={claimStatus} onNewClaim={resetForm} />;
  }

  // Show form
  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-6 h-6 text-teal-600" />
              Submit a Claim
            </CardTitle>
            <CardDescription className="mt-1">
              Step {formStep} of 2: {formStep === 1 ? 'Claim Details' : 'Upload Evidence'}
            </CardDescription>
          </div>
          
          <Button variant="outline" size="sm" onClick={fillDemoData}>
            <Zap className="w-4 h-4 mr-1" />
            Demo Mode
          </Button>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-2 mt-4">
          <div className={`h-1 flex-1 rounded ${formStep >= 1 ? 'bg-teal-500' : 'bg-gray-200'}`} />
          <div className={`h-1 flex-1 rounded ${formStep >= 2 ? 'bg-teal-500' : 'bg-gray-200'}`} />
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {formStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Policy Number */}
                <div className="space-y-2">
                  <Label htmlFor="policy_number">Policy Number</Label>
                  <Input
                    id="policy_number"
                    placeholder="e.g., HLI-MOT-2024-001"
                    {...form.register('policy_number')}
                  />
                  {form.formState.errors.policy_number && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.policy_number.message}
                    </p>
                  )}
                </div>

                {/* Claim Type */}
                <div className="space-y-2">
                  <Label htmlFor="claim_type">Claim Type</Label>
                  <Select
                    onValueChange={(value) => form.setValue('claim_type', value as 'motor' | 'property' | 'health')}
                    value={form.watch('claim_type')}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select claim type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="motor">🚗 Motor Vehicle</SelectItem>
                      <SelectItem value="property">🏠 Property</SelectItem>
                      <SelectItem value="health">🏥 Health</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.claim_type && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.claim_type.message}
                    </p>
                  )}
                </div>

                {/* Incident Date */}
                <div className="space-y-2">
                  <Label htmlFor="incident_date">Incident Date</Label>
                  <Input
                    id="incident_date"
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    {...form.register('incident_date')}
                  />
                  {form.formState.errors.incident_date && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.incident_date.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what happened in detail..."
                    rows={4}
                    {...form.register('description')}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="button"
                    onClick={() => setFormStep(2)}
                    disabled={!form.watch('policy_number') || !form.watch('claim_type') || !form.watch('incident_date') || !form.watch('description')}
                  >
                    Next: Upload Photos
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </motion.div>
            )}

            {formStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Image Upload */}
                <div className="space-y-2">
                  <Label>Damage Photos</Label>
                  <UploadZone
                    value={form.watch('images') || []}
                    onChange={(files) => form.setValue('images', files, { shouldValidate: true })}
                    error={form.formState.errors.images?.message}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setFormStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={submitClaim.isPending || (form.watch('images')?.length || 0) < 1}
                  >
                    {submitClaim.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Claim
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </CardContent>
    </Card>
  );
}
