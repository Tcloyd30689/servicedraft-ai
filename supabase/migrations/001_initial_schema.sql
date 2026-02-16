-- ServiceDraft.AI — Initial Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- USERS TABLE
-- ============================================
create table if not exists public.users (
  id uuid references auth.users on delete cascade primary key,
  email varchar not null,
  username varchar,
  location varchar,
  position varchar,
  profile_picture_url varchar,
  subscription_status varchar default 'trial' check (subscription_status in ('active', 'trial', 'expired', 'bypass')),
  stripe_customer_id varchar,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Users can read their own data
create policy "Users can view own profile"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own data
create policy "Users can update own profile"
  on public.users for update
  using (auth.uid() = id);

-- Users can insert their own profile (on signup)
create policy "Users can insert own profile"
  on public.users for insert
  with check (auth.uid() = id);

-- ============================================
-- NARRATIVES TABLE
-- ============================================
create table if not exists public.narratives (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  ro_number varchar,
  vehicle_year integer,
  vehicle_make varchar,
  vehicle_model varchar,
  concern text,
  cause text,
  correction text,
  full_narrative text,
  story_type varchar check (story_type in ('diagnostic_only', 'repair_complete')),
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.narratives enable row level security;

-- Users can read their own narratives
create policy "Users can view own narratives"
  on public.narratives for select
  using (auth.uid() = user_id);

-- Users can insert their own narratives
create policy "Users can insert own narratives"
  on public.narratives for insert
  with check (auth.uid() = user_id);

-- Users can delete their own narratives
create policy "Users can delete own narratives"
  on public.narratives for delete
  using (auth.uid() = user_id);

-- ============================================
-- INDEXES
-- ============================================
create index if not exists narratives_user_id_idx on public.narratives(user_id);
create index if not exists narratives_created_at_idx on public.narratives(created_at desc);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
