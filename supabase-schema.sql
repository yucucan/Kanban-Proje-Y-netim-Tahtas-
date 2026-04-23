-- ============================================================
-- TaskFlow — Supabase SQL Schema
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- BOARDS
create table public.boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  created_at timestamptz default now()
);
alter table public.boards enable row level security;
create policy "Users own boards" on public.boards
  for all using (auth.uid() = user_id);

-- COLUMNS
create table public.columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  color text default '#3b82f6',
  position float not null default 0,
  created_at timestamptz default now()
);
alter table public.columns enable row level security;
create policy "Users own columns" on public.columns
  for all using (
    exists (select 1 from public.boards where id = board_id and user_id = auth.uid())
  );

-- CARDS
create table public.cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid references public.columns(id) on delete cascade not null,
  board_id uuid references public.boards(id) on delete cascade not null,
  title text not null,
  description text default '',
  position float not null default 0,
  tags text[] default '{}',
  due_date date,
  assignee_name text,
  assignee_color text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.cards enable row level security;
create policy "Users own cards" on public.cards
  for all using (
    exists (select 1 from public.boards where id = board_id and user_id = auth.uid())
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;
create trigger cards_updated_at before update on public.cards
  for each row execute function update_updated_at();
