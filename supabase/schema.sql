-- dep-trust database schema
-- Apply via: Supabase Dashboard > SQL Editor > Run

-- workspaces
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- workspace_members
create table public.workspace_members (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  user_id       uuid not null references auth.users(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner', 'member')),
  created_at    timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- scans
create table public.scans (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null references public.workspaces(id) on delete cascade,
  created_at      timestamptz not null default now(),
  project_name    text not null,
  package_manager text not null check (package_manager in ('npm', 'pnpm')),
  summary         jsonb not null,
  findings        jsonb not null,
  lockfile_hash   text not null
);

-- snapshots
create table public.snapshots (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  project_name  text not null,
  lockfile_hash text not null,
  snapshot      jsonb not null,
  created_at    timestamptz not null default now(),
  unique (workspace_id, project_name)
);

-- allowlist
create table public.allowlist (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  package_name  text not null,
  added_by      uuid not null references auth.users(id),
  created_at    timestamptz not null default now(),
  unique (workspace_id, package_name)
);

-- github_installations
create table public.github_installations (
  id               uuid primary key default gen_random_uuid(),
  workspace_id     uuid not null references public.workspaces(id) on delete cascade,
  installation_id  bigint not null unique,
  account_login    text not null,
  account_type     text not null check (account_type in ('User', 'Organization')),
  created_at       timestamptz not null default now()
);

-- cli_tokens  (raw token never stored — only SHA-256 hash)
create table public.cli_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  token_hash    text not null unique,
  label         text not null default 'CLI',
  last_used_at  timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.workspaces          enable row level security;
alter table public.workspace_members   enable row level security;
alter table public.scans               enable row level security;
alter table public.snapshots           enable row level security;
alter table public.allowlist           enable row level security;
alter table public.github_installations enable row level security;
alter table public.cli_tokens          enable row level security;

-- Helper: is the current user a member of the given workspace?
create or replace function public.is_workspace_member(wid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = wid
      and user_id = auth.uid()
  )
$$;

-- Helper: is the current user the owner of the given workspace?
create or replace function public.is_workspace_owner(wid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = wid
      and user_id = auth.uid()
      and role = 'owner'
  )
$$;

-- workspaces policies
create policy "members can view their workspaces"
  on public.workspaces for select
  using (public.is_workspace_member(id));

create policy "owner can update workspace"
  on public.workspaces for update
  using (public.is_workspace_owner(id));

create policy "owner can delete workspace"
  on public.workspaces for delete
  using (public.is_workspace_owner(id));

create policy "authenticated users can create workspaces"
  on public.workspaces for insert
  with check (auth.uid() = owner_id);

-- workspace_members policies
create policy "members can view workspace membership"
  on public.workspace_members for select
  using (public.is_workspace_member(workspace_id));

create policy "owner can add members"
  on public.workspace_members for insert
  with check (public.is_workspace_owner(workspace_id) or auth.uid() = user_id);

create policy "owner can remove members"
  on public.workspace_members for delete
  using (public.is_workspace_owner(workspace_id));

-- scans policies
create policy "members can view scans"
  on public.scans for select
  using (public.is_workspace_member(workspace_id));

create policy "members can insert scans"
  on public.scans for insert
  with check (public.is_workspace_member(workspace_id));

create policy "owner can delete scans"
  on public.scans for delete
  using (public.is_workspace_owner(workspace_id));

-- snapshots policies
create policy "members can view snapshots"
  on public.snapshots for select
  using (public.is_workspace_member(workspace_id));

create policy "members can insert snapshots"
  on public.snapshots for insert
  with check (public.is_workspace_member(workspace_id));

create policy "members can update snapshots"
  on public.snapshots for update
  using (public.is_workspace_member(workspace_id));

create policy "owner can delete snapshots"
  on public.snapshots for delete
  using (public.is_workspace_owner(workspace_id));

-- allowlist policies
create policy "members can view allowlist"
  on public.allowlist for select
  using (public.is_workspace_member(workspace_id));

create policy "members can add to allowlist"
  on public.allowlist for insert
  with check (public.is_workspace_member(workspace_id) and auth.uid() = added_by);

create policy "owner can remove from allowlist"
  on public.allowlist for delete
  using (public.is_workspace_owner(workspace_id));

-- github_installations policies
create policy "members can view installations"
  on public.github_installations for select
  using (public.is_workspace_member(workspace_id));

create policy "members can add installations"
  on public.github_installations for insert
  with check (public.is_workspace_member(workspace_id));

create policy "owner can remove installations"
  on public.github_installations for delete
  using (public.is_workspace_owner(workspace_id));

-- cli_tokens policies
create policy "users can view their own tokens"
  on public.cli_tokens for select
  using (auth.uid() = user_id);

create policy "users can create their own tokens"
  on public.cli_tokens for insert
  with check (auth.uid() = user_id);

create policy "users can delete their own tokens"
  on public.cli_tokens for delete
  using (auth.uid() = user_id);
