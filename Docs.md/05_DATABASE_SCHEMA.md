# 05 - DATABASE SCHEMA
## PostgreSQL + Supabase Setup

> **Provider**: Supabase Free Tier (500MB database, 1GB storage)

---

## 🗄️ DATABASE ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                      CUSTOMERS TABLE                         │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                │
│ name (VARCHAR)                                               │
│ email (VARCHAR, UNIQUE)                                      │
│ phone (VARCHAR)                                              │
│ policy_number (VARCHAR, UNIQUE) ◄──────────┐               │
│ policy_type (VARCHAR)                       │               │
│ policy_start_date (DATE)                    │               │
│ policy_end_date (DATE)                      │               │
│ policy_limit (INTEGER)                      │               │
│ claim_history_count (INTEGER)               │               │
│ created_at (TIMESTAMP)                      │               │
└─────────────────────────────────────────────┼───────────────┘
                                              │
                                              │ 1:N
                                              │
┌─────────────────────────────────────────────▼───────────────┐
│                       CLAIMS TABLE                           │
├─────────────────────────────────────────────────────────────┤
│ id (UUID, PK)                                                │
│ customer_id (UUID, FK) ──────────────────────┘              │
│ policy_number (VARCHAR, INDEXED)                            │
│ claim_type (ENUM: motor/property/health)                    │
│ incident_date (TIMESTAMP)                                    │
│ incident_description (TEXT)                                  │
│ images (JSONB) ──────────────┐                              │
│ damage_assessment (JSONB)     │                             │
│ fraud_score (INTEGER)         │                             │
│ fraud_flags (JSONB)           │                             │
│ status (ENUM)                 │                             │
│ estimated_amount (INTEGER)    │                             │
│ approved_amount (INTEGER)     │                             │
│ decision_reason (TEXT)        │                             │
│ decision_timestamp (TIMESTAMP)│                             │
│ created_at (TIMESTAMP)        │                             │
│ updated_at (TIMESTAMP)        │                             │
└───────────────────────────────┼─────────────────────────────┘
                                │
                                │ References
                                ▼
                       ┌─────────────────┐
                       │ SUPABASE STORAGE│
                       │ (claim-images)  │
                       │                 │
                       │ /claim-id/1.jpg │
                       │ /claim-id/2.jpg │
                       └─────────────────┘
```

---

## 🏗️ SUPABASE SETUP (5 MINUTES)

### 1. Create Project
```bash
# Visit: https://supabase.com/dashboard
# Click "New Project"
# Project Name: claimguard-ai
# Database Password: [generate strong password]
# Region: Southeast Asia (Singapore) - closest to Nigeria
# Pricing: Free tier
```

### 2. Get Connection Details
```bash
# After project creation, go to:
# Settings > Database > Connection String

# Copy the connection string:
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres

# Convert to async for SQLAlchemy:
postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

### 3. Add to .env
```bash
# backend/.env
DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_KEY=[ANON_KEY from Settings > API]
```

---

## 📝 SQL SCHEMA (Run in Supabase SQL Editor)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    email VARCHAR(200) UNIQUE NOT NULL,
    phone VARCHAR(20),
    
    -- Policy details
    policy_number VARCHAR(50) UNIQUE NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    policy_start_date DATE NOT NULL,
    policy_end_date DATE NOT NULL,
    policy_limit INTEGER DEFAULT 2000000,
    
    -- History
    claim_history_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claims table
CREATE TABLE claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Claim details
    policy_number VARCHAR(50) NOT NULL,
    claim_type VARCHAR(20) NOT NULL CHECK (claim_type IN ('motor', 'property', 'health')),
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    incident_description TEXT NOT NULL,
    
    -- Images (array of Supabase URLs)
    images JSONB DEFAULT '[]'::jsonb,
    
    -- AI Analysis
    damage_assessment JSONB,
    fraud_score INTEGER DEFAULT 0 CHECK (fraud_score >= 0 AND fraud_score <= 100),
    fraud_flags JSONB DEFAULT '[]'::jsonb,
    
    -- Decision
    status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'under_review', 'rejected')),
    estimated_amount INTEGER DEFAULT 0,
    approved_amount INTEGER,
    decision_reason TEXT,
    decision_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_claims_policy_number ON claims(policy_number);
CREATE INDEX idx_claims_customer_id ON claims(customer_id);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_created_at ON claims(created_at DESC);
CREATE INDEX idx_claims_fraud_score ON claims(fraud_score DESC);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_claims_updated_at BEFORE UPDATE ON claims
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 🌱 SEED DATA (Demo Accounts)

```sql
-- Insert demo customers
INSERT INTO customers (name, email, phone, policy_number, policy_type, policy_start_date, policy_end_date, policy_limit) VALUES
('Tunde Adeyemi', 'tunde@example.com', '+234-801-234-5678', 'HIG-MOT-2024-001', 'Comprehensive Motor', '2024-01-01', '2025-01-01', 2000000),
('Amara Okafor', 'amara@example.com', '+234-802-345-6789', 'HIG-MOT-2024-002', 'Comprehensive Motor', '2024-02-15', '2025-02-15', 1500000),
('Chidi Nwosu', 'chidi@example.com', '+234-803-456-7890', 'HIG-PROP-2024-003', 'Home Insurance', '2024-03-01', '2025-03-01', 5000000),
('Ngozi Eze', 'ngozi@example.com', '+234-804-567-8901', 'HIG-MOT-2024-004', 'Third Party Motor', '2024-01-15', '2025-01-15', 1000000),
('Femi Balogun', 'femi@example.com', '+234-805-678-9012', 'HIG-MOT-2024-005', 'Comprehensive Motor', '2023-12-01', '2024-12-01', 2500000);

-- Insert sample claim (for testing)
INSERT INTO claims (
    customer_id, 
    policy_number, 
    claim_type, 
    incident_date, 
    incident_description,
    status,
    estimated_amount
) VALUES (
    (SELECT id FROM customers WHERE policy_number = 'HIG-MOT-2024-001'),
    'HIG-MOT-2024-001',
    'motor',
    NOW() - INTERVAL '2 days',
    'Minor collision at traffic light. Front bumper damaged.',
    'pending',
    0
);
```

---

## 🪣 SUPABASE STORAGE SETUP

### 1. Create Storage Bucket
```sql
-- Run in Supabase SQL Editor
-- This creates a public bucket for claim images

INSERT INTO storage.buckets (id, name, public)
VALUES ('claim-images', 'claim-images', true);

-- Set public access policy
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'claim-images');

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'claim-images' AND auth.role() = 'authenticated');
```

### 2. Test Upload (Python)
```python
from supabase import create_client
import os

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Upload test
with open("test_image.jpg", "rb") as f:
    supabase.storage.from_("claim-images").upload(
        "test/sample.jpg",
        f.read(),
        {"content-type": "image/jpeg"}
    )

# Get public URL
url = supabase.storage.from_("claim-images").get_public_url("test/sample.jpg")
print(f"✓ Upload successful: {url}")
```

---

## 🔄 ALEMBIC MIGRATIONS (Optional)

### Setup
```bash
# Install Alembic
pip install alembic

# Initialize
alembic init alembic

# Edit alembic.ini
# sqlalchemy.url = postgresql+asyncpg://...
```

### Create Migration
```bash
# Auto-generate from models
alembic revision --autogenerate -m "Create claims and customers tables"

# Apply migration
alembic upgrade head
```

---

## 📊 USEFUL QUERIES

### Admin Dashboard Stats
```sql
-- Claims today
SELECT COUNT(*) as claims_today
FROM claims
WHERE created_at >= CURRENT_DATE;

-- Average processing time (pending → decided)
SELECT AVG(EXTRACT(EPOCH FROM (decision_timestamp - created_at))) as avg_seconds
FROM claims
WHERE decision_timestamp IS NOT NULL
AND created_at >= CURRENT_DATE;

-- Fraud detection rate
SELECT 
    COUNT(*) FILTER (WHERE fraud_score > 70) as high_risk,
    COUNT(*) as total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE fraud_score > 70) / COUNT(*), 2) as fraud_rate
FROM claims
WHERE created_at >= CURRENT_DATE;

-- Approval rate
SELECT 
    status,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM claims
WHERE decision_timestamp IS NOT NULL
GROUP BY status;
```

### Fraud Analytics
```sql
-- Top fraud signals
SELECT 
    unnest(fraud_flags) as flag,
    COUNT(*) as occurrences
FROM claims
WHERE array_length(fraud_flags, 1) > 0
GROUP BY flag
ORDER BY occurrences DESC
LIMIT 10;

-- Claims by fraud score range
SELECT 
    CASE 
        WHEN fraud_score BETWEEN 0 AND 30 THEN 'Low Risk (0-30)'
        WHEN fraud_score BETWEEN 31 AND 70 THEN 'Medium Risk (31-70)'
        ELSE 'High Risk (71-100)'
    END as risk_level,
    COUNT(*) as count
FROM claims
GROUP BY risk_level
ORDER BY MIN(fraud_score);
```

---

## 🔐 SECURITY BEST PRACTICES

### Row Level Security (RLS)
```sql
-- Enable RLS on claims table
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own claims
CREATE POLICY "Users see own claims"
ON claims FOR SELECT
USING (customer_id = auth.uid());

-- Policy: Admins see all claims
CREATE POLICY "Admins see all claims"
ON claims FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM customers
        WHERE customers.id = auth.uid()
        AND customers.email LIKE '%@claimguard.ai'
    )
);
```

### API Key Protection
```bash
# Never commit .env file
echo ".env" >> .gitignore

# Use environment variables in production
# Railway/Render will inject these securely
```

---

## ✅ CHECKLIST

- [ ] Create Supabase project
- [ ] Copy connection string
- [ ] Run schema SQL
- [ ] Insert seed data
- [ ] Create storage bucket
- [ ] Test database connection
- [ ] Test image upload
- [ ] Create indexes
- [ ] Setup RLS policies (if needed)
- [ ] Test queries

**Status**: Database schema complete ✅
