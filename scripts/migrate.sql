-- ============================================================
-- RestaurantOS — migration script
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. CUSTOMERS
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  phone text,
  dietary_notes text,
  allergies text,
  important_note text,
  notes text,
  visit_count integer not null default 0,
  created_at timestamptz not null default now()
);

-- 2. STAFF
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  hourly_rate numeric(10,2) not null default 0,
  phone text,
  email text,
  created_at timestamptz not null default now()
);

-- 3. SHIFTS
create table if not exists shifts (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references staff(id) on delete cascade,
  shift_date date not null,
  hours_worked numeric(5,2) not null,
  notes text,
  created_at timestamptz not null default now()
);

-- 4. Add new columns to bookings (safe — uses IF NOT EXISTS equivalent)
alter table bookings add column if not exists session text;
alter table bookings add column if not exists customer_id uuid references customers(id) on delete set null;

-- 5. Function to increment visit count
create or replace function increment_visit_count(customer_id uuid)
returns void language sql as $$
  update customers set visit_count = visit_count + 1 where id = customer_id;
$$;

-- 6. Disable RLS on new tables (consistent with existing tables)
alter table customers disable row level security;
alter table staff disable row level security;
alter table shifts disable row level security;
