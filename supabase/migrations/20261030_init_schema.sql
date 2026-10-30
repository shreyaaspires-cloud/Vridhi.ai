-- ====================================================================
-- Vridhi.ai Supabase Database Schema Migration
-- Run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/gjokhcyndsnqawkpipcn/sql/new
-- ====================================================================

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'borrower' CHECK (role IN ('borrower', 'lender', 'admin')),
    full_name TEXT,
    company_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'borrower'),
        COALESCE(NEW.raw_user_meta_data->>'full_name', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users into profiles
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'role', 'borrower'), 
    COALESCE(raw_user_meta_data->>'full_name', '')
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 2. Score History Table
CREATE TABLE IF NOT EXISTS public.score_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    risk_score NUMERIC NOT NULL,
    risk_label TEXT NOT NULL,
    confidence NUMERIC,
    default_probability NUMERIC,
    assessed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on score_history
ALTER TABLE public.score_history ENABLE ROW LEVEL SECURITY;

-- Score History Policies
DROP POLICY IF EXISTS "Users can read own score history" ON public.score_history;
CREATE POLICY "Users can read own score history"
    ON public.score_history FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own score history" ON public.score_history;
CREATE POLICY "Users can insert own score history"
    ON public.score_history FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own score history" ON public.score_history;
CREATE POLICY "Users can delete own score history"
    ON public.score_history FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- 3. Document Verifications Table
CREATE TABLE IF NOT EXISTS public.document_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    verification_score NUMERIC,
    comparison_results JSONB DEFAULT '{}'::jsonb,
    flags JSONB DEFAULT '[]'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on document_verifications
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

-- Document Verifications Policies
DROP POLICY IF EXISTS "Users can view own verifications" ON public.document_verifications;
CREATE POLICY "Users can view own verifications"
    ON public.document_verifications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own verifications" ON public.document_verifications;
CREATE POLICY "Users can insert own verifications"
    ON public.document_verifications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);


-- 4. Lender Notes Table
CREATE TABLE IF NOT EXISTS public.lender_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    score_history_id TEXT,
    borrower_business_name TEXT NOT NULL,
    note_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on lender_notes
ALTER TABLE public.lender_notes ENABLE ROW LEVEL SECURITY;

-- Lender Notes Policies
DROP POLICY IF EXISTS "Lenders can read all notes" ON public.lender_notes;
CREATE POLICY "Lenders can read all notes"
    ON public.lender_notes FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Lenders can insert notes" ON public.lender_notes;
CREATE POLICY "Lenders can insert notes"
    ON public.lender_notes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = lender_user_id);

DROP POLICY IF EXISTS "Lenders can delete own notes" ON public.lender_notes;
CREATE POLICY "Lenders can delete own notes"
    ON public.lender_notes FOR DELETE
    TO authenticated
    USING (auth.uid() = lender_user_id);


-- 5. Permissions Grant to public roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;

