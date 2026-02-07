# 01 - DESIGN SYSTEM
## ClaimGuard AI - Visual Language & Component Library

> **Philosophy**: "Trust through transparency, speed through simplicity."

---

## 🎨 COLOR PALETTE (Tailwind CSS Variables)

### Setup: `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;        /* #F8FAFC - Soft blue-gray */
    --foreground: 222 47% 11%;        /* #1E293B - Deep slate */

    --card: 0 0% 100%;                /* #FFFFFF */
    --card-foreground: 222 47% 11%;

    --primary: 175 84% 32%;           /* #0D9488 - Trust teal */
    --primary-foreground: 0 0% 100%;

    --secondary: 175 60% 44%;         /* #14B8A6 - Light teal */
    --secondary-foreground: 0 0% 100%;

    --accent: 174 72% 56%;            /* #5EEAD4 - Highlight aqua */
    --accent-foreground: 175 84% 15%;

    --success: 142 71% 45%;           /* #10B981 - Approval green */
    --success-foreground: 0 0% 100%;

    --warning: 38 92% 50%;            /* #F59E0B - Review amber */
    --warning-foreground: 0 0% 100%;

    --destructive: 0 84% 60%;         /* #EF4444 - Rejection red */
    --destructive-foreground: 0 0% 100%;

    --muted: 210 40% 96%;             /* #F1F5F9 */
    --muted-foreground: 215 16% 47%;  /* #64748B */

    --border: 214 32% 91%;            /* #CBD5E1 */
    --input: 214 32% 91%;
    --ring: 175 84% 32%;

    --radius: 0.75rem;                /* 12px - Softer than default */
  }
}
```

### Tailwind Config: `tailwind.config.ts`
```typescript
import type { Config } from "tailwindcss"

const config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)"],
        mono: ["var(--font-jetbrains-mono)"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-slow": "pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
```

---

## 📝 TYPOGRAPHY

### Font Setup: `app/layout.tsx`
```typescript
import { Inter, JetBrains_Mono } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  )
}
```

### Type Scale
```typescript
// components/ui/typography.tsx
export const Typography = {
  h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
  h2: "scroll-m-20 text-3xl font-semibold tracking-tight",
  h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
  h4: "scroll-m-20 text-xl font-semibold tracking-tight",
  p: "leading-7 [&:not(:first-child)]:mt-6",
  lead: "text-xl text-muted-foreground",
  large: "text-lg font-semibold",
  small: "text-sm font-medium leading-none",
  muted: "text-sm text-muted-foreground",
  code: "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm",
}
```

---

## 🧩 SHADCN/UI COMPONENTS (Install First)

```bash
# Core components for ClaimGuard
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add select
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add skeleton
```

---

## 🎯 CUSTOM COMPONENTS

### 1. Claim Status Badge
```typescript
// components/ui/claim-badge.tsx
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react"

type ClaimStatus = "approved" | "review" | "rejected"

const statusConfig = {
  approved: {
    variant: "default" as const,
    className: "bg-success text-success-foreground",
    icon: CheckCircle2,
    label: "Approved",
  },
  review: {
    variant: "secondary" as const,
    className: "bg-warning text-warning-foreground",
    icon: AlertTriangle,
    label: "Under Review",
  },
  rejected: {
    variant: "destructive" as const,
    className: "bg-destructive text-destructive-foreground",
    icon: XCircle,
    label: "Rejected",
  },
}

export function ClaimBadge({ status }: { status: ClaimStatus }) {
  const config = statusConfig[status]
  const Icon = config.icon
  
  return (
    <Badge variant={config.variant} className={config.className}>
      <Icon className="mr-1.5 h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}
```

### 2. Animated Stat Card
```typescript
// components/ui/stat-card.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  format?: "currency" | "number" | "percentage"
}

export function StatCard({ title, value, change, format }: StatCardProps) {
  const isPositive = change && change > 0
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-bold"
        >
          {format === "currency" && "₦"}
          {value.toLocaleString()}
          {format === "percentage" && "%"}
        </motion.div>
        {change !== undefined && (
          <p className={`text-xs flex items-center mt-1 ${
            isPositive ? "text-success" : "text-destructive"
          }`}>
            {isPositive ? (
              <TrendingUp className="mr-1 h-4 w-4" />
            ) : (
              <TrendingDown className="mr-1 h-4 w-4" />
            )}
            {Math.abs(change)}% from yesterday
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

### 3. Processing Animation
```typescript
// components/ui/processing-animation.tsx
"use client"

import { motion } from "framer-motion"
import { Loader2, CheckCircle2 } from "lucide-react"

interface ProcessingStep {
  label: string
  status: "pending" | "processing" | "complete"
}

export function ProcessingAnimation({ steps }: { steps: ProcessingStep[] }) {
  return (
    <div className="space-y-4 p-6">
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.2 }}
          className="flex items-center gap-3"
        >
          {step.status === "complete" && (
            <CheckCircle2 className="h-5 w-5 text-success" />
          )}
          {step.status === "processing" && (
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
          )}
          {step.status === "pending" && (
            <div className="h-5 w-5 rounded-full border-2 border-muted" />
          )}
          <span className={
            step.status === "complete" 
              ? "text-foreground" 
              : "text-muted-foreground"
          }>
            {step.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}
```

### 4. Image Upload Zone
```typescript
// components/ui/upload-zone.tsx
"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, Image as ImageIcon } from "lucide-react"
import { Card } from "@/components/ui/card"

interface UploadZoneProps {
  onUpload: (files: File[]) => void
  maxFiles?: number
}

export function UploadZone({ onUpload, maxFiles = 4 }: UploadZoneProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onUpload(acceptedFiles)
  }, [onUpload])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles,
  })

  return (
    <Card
      {...getRootProps()}
      className={`
        border-2 border-dashed cursor-pointer transition-all
        hover:border-primary hover:bg-primary/5
        ${isDragActive ? 'border-primary bg-primary/10' : 'border-muted'}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center p-12 text-center">
        {isDragActive ? (
          <Upload className="h-12 w-12 text-primary mb-4" />
        ) : (
          <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
        )}
        <p className="text-lg font-medium mb-2">
          {isDragActive ? "Drop photos here" : "Upload damage photos"}
        </p>
        <p className="text-sm text-muted-foreground">
          Drag & drop or click to browse (max {maxFiles} photos)
        </p>
      </div>
    </Card>
  )
}
```

---

## 📐 LAYOUT PATTERNS

### 1. Hero Section
```typescript
// app/page.tsx
export default function HomePage() {
  return (
    <section className="container flex flex-col items-center justify-center gap-8 py-24">
      <div className="flex max-w-[980px] flex-col items-center gap-4 text-center">
        <h1 className="text-4xl font-bold leading-tight tracking-tighter md:text-6xl lg:text-7xl">
          Claims Settled in{" "}
          <span className="text-primary">60 Seconds</span>
        </h1>
        <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
          AI-powered fraud detection approves legitimate claims instantly.
          No paperwork. No waiting.
        </p>
        <div className="flex gap-4 mt-4">
          <Button size="lg" className="gap-2">
            Submit a Claim
            <Upload className="h-4 w-4" />
          </Button>
          <Button size="lg" variant="outline">
            Watch Demo
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          247 claims processed today • ₦124M fraud prevented
        </p>
      </div>
    </section>
  )
}
```

### 2. Dashboard Grid
```typescript
// app/admin/page.tsx
export default function AdminDashboard() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Claims Today" value={247} change={12} />
        <StatCard title="Avg Process Time" value="47s" />
        <StatCard title="Fraud Detected" value={18} change={-5} />
        <StatCard title="Approval Rate" value={73} format="percentage" />
      </div>

      {/* Claims Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Claims</CardTitle>
        </CardHeader>
        <CardContent>
          {/* TanStack Table goes here */}
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🎬 ANIMATION PATTERNS (Framer Motion)

```typescript
// lib/animations.ts
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
}

export const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export const scaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: { type: "spring", stiffness: 200, damping: 20 }
}
```

---

## ✅ DESIGN CHECKLIST

- [ ] Install Shadcn/UI components
- [ ] Configure Tailwind with color tokens
- [ ] Add Inter + JetBrains Mono fonts
- [ ] Create custom ClaimBadge component
- [ ] Create StatCard component
- [ ] Create ProcessingAnimation component
- [ ] Create UploadZone component
- [ ] Test responsive layout on mobile
- [ ] Add loading skeletons
- [ ] Test dark mode (if implementing)

---

**Status**: Design system complete ✅  
**Next**: Gemini API integration →
