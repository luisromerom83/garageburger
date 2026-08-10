-- Supabase SQL Schema for GarageBurger
-- Execute this script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Table for Store Configuration & Hero / Announcements
CREATE TABLE IF NOT EXISTS public.garage_config (
  id INT PRIMARY KEY DEFAULT 1,
  config_data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table for Menu Products
CREATE TABLE IF NOT EXISTS public.garage_menu (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  image TEXT,
  badge TEXT,
  available BOOLEAN DEFAULT TRUE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Turn on Row Level Security (RLS) and allow public read access
ALTER TABLE public.garage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.garage_menu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for config" ON public.garage_config FOR SELECT USING (true);
CREATE POLICY "Allow public read access for menu" ON public.garage_menu FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update for config" ON public.garage_config FOR ALL USING (true);
CREATE POLICY "Allow public insert/update for menu" ON public.garage_menu FOR ALL USING (true);
