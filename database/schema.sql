-- ==============================================================================
-- AI-Powered Online Cafe Finder, Search & Comparison Web Application
-- Supabase PostgreSQL Database Schema with Row Level Security (RLS)
-- ==============================================================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. FAVORITES TABLE (Stores user's saved cafes by Google place_id)
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    cafe_name TEXT NOT NULL,
    cafe_address TEXT,
    rating NUMERIC(2, 1),
    user_ratings_total INTEGER,
    price_level INTEGER,
    photo_reference TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_place UNIQUE (user_id, place_id)
);

-- 3. SEARCH HISTORY TABLE
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    location_name TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. SAVED COMPARISONS TABLE
CREATE TABLE IF NOT EXISTS public.saved_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    preference TEXT DEFAULT 'highest_rated',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. COMPARISON CAFES TABLE (Stores individual cafes in a comparison set)
CREATE TABLE IF NOT EXISTS public.comparison_cafes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_id UUID NOT NULL REFERENCES public.saved_comparisons(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    cafe_name TEXT NOT NULL,
    rating NUMERIC(2, 1),
    reviews_count INTEGER,
    price_level INTEGER,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==============================================================================
-- INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_place_id ON public.favorites(place_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON public.search_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_comparisons_user_id ON public.saved_comparisons(user_id);
CREATE INDEX IF NOT EXISTS idx_comparison_cafes_comparison_id ON public.comparison_cafes(comparison_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comparison_cafes ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Profiles Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------------
-- Favorites Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
CREATE POLICY "Users can view own favorites" 
ON public.favorites FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
CREATE POLICY "Users can insert own favorites" 
ON public.favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
CREATE POLICY "Users can delete own favorites" 
ON public.favorites FOR DELETE 
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Search History Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history" 
ON public.search_history FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;
CREATE POLICY "Users can insert own search history" 
ON public.search_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own search history" ON public.search_history;
CREATE POLICY "Users can delete own search history" 
ON public.search_history FOR DELETE 
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Saved Comparisons Policies
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own comparisons" ON public.saved_comparisons;
CREATE POLICY "Users can view own comparisons" 
ON public.saved_comparisons FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own comparisons" ON public.saved_comparisons;
CREATE POLICY "Users can insert own comparisons" 
ON public.saved_comparisons FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comparisons" ON public.saved_comparisons;
CREATE POLICY "Users can update own comparisons" 
ON public.saved_comparisons FOR UPDATE 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comparisons" ON public.saved_comparisons;
CREATE POLICY "Users can delete own comparisons" 
ON public.saved_comparisons FOR DELETE 
USING (auth.uid() = user_id);

-- ------------------------------------------------------------------------------
-- Comparison Cafes Policies (Accessible only via owned parent comparison)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own comparison cafes" ON public.comparison_cafes;
CREATE POLICY "Users can view own comparison cafes" 
ON public.comparison_cafes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.saved_comparisons sc
        WHERE sc.id = comparison_cafes.comparison_id 
        AND sc.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can insert own comparison cafes" ON public.comparison_cafes;
CREATE POLICY "Users can insert own comparison cafes" 
ON public.comparison_cafes FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.saved_comparisons sc
        WHERE sc.id = comparison_cafes.comparison_id 
        AND sc.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Users can delete own comparison cafes" ON public.comparison_cafes;
CREATE POLICY "Users can delete own comparison cafes" 
ON public.comparison_cafes FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.saved_comparisons sc
        WHERE sc.id = comparison_cafes.comparison_id 
        AND sc.user_id = auth.uid()
    )
);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
