# 03 - FRONTEND GUIDE
## Next.js 14 + TypeScript Implementation

> **Stack**: App Router, Server Components, TanStack Query, React Hook Form

---

## 🏗️ PROJECT STRUCTURE

```
frontend/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                 # Landing page
│   │   ├── submit/
│   │   │   └── page.tsx             # Claim submission flow
│   │   └── result/[id]/
│   │       └── page.tsx             # Claim result
│   ├── admin/
│   │   ├── layout.tsx               # Admin sidebar
│   │   └── page.tsx                 # Dashboard
│   ├── api/
│   │   └── claims/
│   │       └── route.ts             # Proxy to FastAPI
│   ├── layout.tsx                   # Root layout
│   └── globals.css                  # Tailwind + CSS vars
├── components/
│   ├── ui/                          # Shadcn components
│   ├── claim-form.tsx               # Multi-step form
│   ├── processing-animation.tsx     # Loading state
│   └── result-display.tsx           # Decision UI
├── lib/
│   ├── api.ts                       # Axios instance
│   ├── queries.ts                   # TanStack Query hooks
│   └── validations.ts               # Zod schemas
└── types/
    └── index.ts                     # TypeScript interfaces
```

---

## 📦 DEPENDENCIES

```bash
npm install @tanstack/react-query zustand axios react-hook-form zod framer-motion
npm install @tanstack/react-query-devtools -D
npm install react-dropzone lucide-react sonner
```

---

## 🔷 TYPE DEFINITIONS

```typescript
// types/index.ts
export type ClaimStatus = "pending" | "approved" | "under_review" | "rejected"

export interface Claim {
  id: string
  policy_number: string
  claim_type: "motor" | "property" | "health"
  incident_date: string
  incident_description: string
  images: string[]
  status: ClaimStatus
  fraud_score: number
  estimated_amount: number
  approved_amount: number | null
  created_at: string
}

export interface DamageAssessment {
  damage_type: string
  severity: "minor" | "moderate" | "severe"
  estimated_cost_ngn: number
  damaged_items: string[]
  confidence: number
  reasoning: string
}

export interface ClaimSubmission {
  policy_number: string
  claim_type: "motor" | "property" | "health"
  incident_date: string
  description: string
  images: File[]
}

export interface ClaimResult {
  claim_id: string
  decision: "approved" | "review" | "rejected"
  approved_amount: number | null
  reason: string
  flags: string[]
  next_steps: string
  damage_assessment: DamageAssessment
  fraud_score: number
}
```

---

## 🎯 ZOD VALIDATION SCHEMAS

```typescript
// lib/validations.ts
import { z } from "zod"

export const claimFormSchema = z.object({
  policy_number: z.string()
    .min(5, "Policy number must be at least 5 characters")
    .regex(/^[A-Z]{3}-[A-Z]{3}-\d{4}-\d{3}$/, "Invalid format (e.g., HIG-MOT-2024-001)"),
  
  claim_type: z.enum(["motor", "property", "health"]),
  
  incident_date: z.string()
    .refine((date) => new Date(date) <= new Date(), "Date cannot be in the future")
    .refine((date) => {
      const daysDiff = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24))
      return daysDiff <= 30
    }, "Incident must be within last 30 days"),
  
  description: z.string()
    .min(20, "Please provide more details (min 20 characters)")
    .max(500, "Description too long (max 500 characters)"),
  
  images: z.array(z.instanceof(File))
    .min(2, "Upload at least 2 photos")
    .max(4, "Maximum 4 photos allowed")
    .refine((files) => {
      return files.every(file => file.size <= 5 * 1024 * 1024) // 5MB
    }, "Each image must be under 5MB")
    .refine((files) => {
      const validTypes = ["image/jpeg", "image/png", "image/webp"]
      return files.every(file => validTypes.includes(file.type))
    }, "Only JPG, PNG, and WebP images allowed")
})

export type ClaimFormValues = z.infer<typeof claimFormSchema>
```

---

## 🔌 API CLIENT

```typescript
// lib/api.ts
import axios from "axios"

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json"
  }
})

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
  console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("❌ API Error:", error.response?.data || error.message)
    throw error
  }
)
```

---

## 🪝 TANSTACK QUERY HOOKS

```typescript
// lib/queries.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "./api"
import type { ClaimSubmission, ClaimResult, Claim } from "@/types"

// Submit claim mutation
export function useSubmitClaim() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: ClaimSubmission) => {
      const formData = new FormData()
      formData.append("policy_number", data.policy_number)
      formData.append("claim_type", data.claim_type)
      formData.append("incident_date", data.incident_date)
      formData.append("description", data.description)
      
      data.images.forEach((image, index) => {
        formData.append("images", image)
      })
      
      const response = await api.post<{ claim_id: string }>("/api/v1/claims/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      })
      
      return response.data
    },
    onSuccess: () => {
      // Invalidate claims list
      queryClient.invalidateQueries({ queryKey: ["claims"] })
    }
  })
}

// Get claim status (polling)
export function useClaimStatus(claimId: string | null) {
  return useQuery({
    queryKey: ["claim", claimId],
    queryFn: async () => {
      if (!claimId) throw new Error("No claim ID")
      const response = await api.get<ClaimResult>(`/api/v1/claims/${claimId}/status`)
      return response.data
    },
    enabled: !!claimId,
    refetchInterval: (data) => {
      // Stop polling when decision is made
      if (data?.decision) return false
      return 2000 // Poll every 2 seconds
    }
  })
}

// Get all claims (admin)
export function useClaims(filters?: { status?: string }) {
  return useQuery({
    queryKey: ["claims", filters],
    queryFn: async () => {
      const response = await api.get<{ claims: Claim[]; total: number }>("/api/v1/admin/claims", {
        params: filters
      })
      return response.data
    }
  })
}
```

---

## 📝 MULTI-STEP CLAIM FORM

```typescript
// components/claim-form.tsx
"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { claimFormSchema, type ClaimFormValues } from "@/lib/validations"
import { useSubmitClaim } from "@/lib/queries"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UploadZone } from "@/components/ui/upload-zone"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function ClaimForm() {
  const [step, setStep] = useState(1)
  const router = useRouter()
  
  const form = useForm<ClaimFormValues>({
    resolver: zodResolver(claimFormSchema),
    defaultValues: {
      policy_number: "",
      claim_type: "motor",
      incident_date: "",
      description: "",
      images: []
    }
  })
  
  const submitClaim = useSubmitClaim()
  
  const onSubmit = async (data: ClaimFormValues) => {
    try {
      const result = await submitClaim.mutateAsync(data)
      toast.success("Claim submitted! Processing...")
      router.push(`/result/${result.claim_id}`)
    } catch (error) {
      toast.error("Failed to submit claim. Please try again.")
    }
  }
  
  const nextStep = async () => {
    const isValid = await form.trigger(
      step === 1 
        ? ["policy_number", "claim_type", "incident_date", "description"]
        : ["images"]
    )
    if (isValid) setStep(step + 1)
  }
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex-1 h-2 rounded ${i <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>
      
      {/* Step 1: Details */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Tell us what happened</h2>
          
          <div>
            <Label htmlFor="policy_number">Policy Number</Label>
            <Input
              id="policy_number"
              placeholder="HIG-MOT-2024-001"
              {...form.register("policy_number")}
            />
            {form.formState.errors.policy_number && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.policy_number.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="claim_type">Claim Type</Label>
            <Select
              value={form.watch("claim_type")}
              onValueChange={(value) => form.setValue("claim_type", value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="motor">Motor Insurance</SelectItem>
                <SelectItem value="property">Property Insurance</SelectItem>
                <SelectItem value="health">Health Insurance</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="incident_date">When did it happen?</Label>
            <Input
              id="incident_date"
              type="date"
              max={new Date().toISOString().split('T')[0]}
              {...form.register("incident_date")}
            />
            {form.formState.errors.incident_date && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.incident_date.message}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">What happened?</Label>
            <Textarea
              id="description"
              placeholder="Describe the incident..."
              rows={4}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.description.message}
              </p>
            )}
          </div>
          
          <Button type="button" onClick={nextStep} className="w-full">
            Continue →
          </Button>
        </div>
      )}
      
      {/* Step 2: Upload */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upload damage photos</h2>
          
          <UploadZone
            onUpload={(files) => form.setValue("images", files)}
            maxFiles={4}
          />
          
          {form.formState.errors.images && (
            <p className="text-sm text-destructive">
              {form.formState.errors.images.message}
            </p>
          )}
          
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button type="submit" disabled={submitClaim.isPending} className="flex-1">
              {submitClaim.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
```

---

## ⏳ PROCESSING ANIMATION

```typescript
// app/result/[id]/page.tsx
"use client"

import { useClaimStatus } from "@/lib/queries"
import { ProcessingAnimation } from "@/components/ui/processing-animation"
import { ResultDisplay } from "@/components/result-display"

export default function ResultPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useClaimStatus(params.id)
  
  if (isLoading || !data?.decision) {
    return (
      <div className="container max-w-2xl py-16">
        <ProcessingAnimation
          steps={[
            { label: "Analyzing images...", status: data ? "complete" : "processing" },
            { label: "Assessing damage...", status: data ? "processing" : "pending" },
            { label: "Running fraud checks...", status: "pending" },
            { label: "Calculating payout...", status: "pending" }
          ]}
        />
      </div>
    )
  }
  
  return (
    <div className="container max-w-2xl py-16">
      <ResultDisplay result={data} />
    </div>
  )
}
```

---

## ✅ CHECKLIST

- [ ] Install dependencies
- [ ] Setup TanStack Query provider
- [ ] Create type definitions
- [ ] Setup Zod schemas
- [ ] Create API client
- [ ] Build claim form component
- [ ] Build upload zone
- [ ] Build processing animation
- [ ] Build result display
- [ ] Test form validation
- [ ] Test API integration

**Status**: Frontend guide complete ✅
