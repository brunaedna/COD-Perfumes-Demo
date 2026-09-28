create table if not exists public.erp_user_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.erp_user_states enable row level security;

drop policy if exists "erp_user_states_select_own" on public.erp_user_states;
create policy "erp_user_states_select_own"
on public.erp_user_states
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "erp_user_states_insert_own" on public.erp_user_states;
create policy "erp_user_states_insert_own"
on public.erp_user_states
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "erp_user_states_update_own" on public.erp_user_states;
create policy "erp_user_states_update_own"
on public.erp_user_states
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "erp_user_states_delete_own" on public.erp_user_states;
create policy "erp_user_states_delete_own"
on public.erp_user_states
for delete
to authenticated
using (auth.uid() = user_id);
