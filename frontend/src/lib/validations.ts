// Zod validation schemas for claim form
import { z } from 'zod';

export const claimFormSchema = z.object({
    policy_number: z
        .string()
        .min(5, 'Policy number must be at least 5 characters')
        .max(50, 'Policy number too long')
        .regex(/^[A-Z0-9-]+$/i, 'Policy number can only contain letters, numbers, and dashes'),

    claim_type: z.enum(['motor', 'property', 'health'], {
        message: 'Please select a claim type',
    }),

    incident_date: z
        .string()
        .refine((date) => {
            const d = new Date(date);
            const now = new Date();
            return d <= now;
        }, 'Incident date cannot be in the future')
        .refine((date) => {
            const d = new Date(date);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return d >= thirtyDaysAgo;
        }, 'Incident must be within the last 30 days'),

    description: z
        .string()
        .min(20, 'Please provide more detail (at least 20 characters)')
        .max(500, 'Description too long (max 500 characters)'),

    images: z
        .array(z.instanceof(File))
        .min(1, 'Please upload at least 1 image')
        .max(4, 'Maximum 4 images allowed')
        .refine(
            (files) => files.every((file) => file.size <= 10 * 1024 * 1024),
            'Each image must be less than 10MB'
        )
        .refine(
            (files) => files.every((file) =>
                ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            ),
            'Only JPEG, PNG, and WebP images are accepted'
        ),
});

export type ClaimFormValues = z.infer<typeof claimFormSchema>;

// Demo data for quick testing
export const DEMO_DATA: Partial<ClaimFormValues> = {
    policy_number: 'HLI-MOT-2024-001',
    claim_type: 'motor',
    description: 'My vehicle was involved in a minor collision at the intersection. The front bumper and headlight assembly were damaged.',
};
