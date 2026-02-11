-- Konark HRM database schema for Supabase/PostgreSQL
-- Run this script in the Supabase SQL editor.

create extension if not exists "pgcrypto";

-- --- Enums ---
do $$ begin
  create type public.user_role as enum ('HR_ADMIN', 'SITE_INCHARGE', 'EMPLOYEE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.employee_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.record_status as enum ('ACTIVE', 'INACTIVE');
exception when duplicate_object then null;
end $$;

-- --- Tables ---
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role public.user_role not null default 'HR_ADMIN',
  created_at timestamptz not null default now()
);

create table if not exists public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text not null,
  incharge_id uuid null,
  employee_count integer not null default 0,
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  uan varchar(12) not null unique,
  name text not null,
  mobile varchar(15) not null,
  role text not null,
  site_id uuid not null references public.sites(id),
  status public.employee_status not null default 'PENDING',
  joined_date date not null default current_date,
  bank_name text,
  account_number text,
  ifsc text,
  basic_salary numeric(12, 2),
  photo_url text,
  created_at timestamptz not null default now(),
  constraint employees_uan_digits check (uan ~ '^\\d{12}$')
);

create table if not exists public.salary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  employee_name text not null,
  uan varchar(12) not null,
  month varchar(7) not null,
  year integer not null,
  basic numeric(12, 2) not null default 0,
  hra numeric(12, 2) not null default 0,
  allowances numeric(12, 2) not null default 0,
  deductions numeric(12, 2) not null default 0,
  net_payable numeric(12, 2) not null default 0,
  paid_days integer not null default 0,
  created_at timestamptz not null default now(),
  constraint salary_records_month_fmt check (month ~ '^(0[1-9]|1[0-2])-\\d{4}$'),
  constraint salary_records_unique_emp_month unique (employee_id, month)
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text not null,
  logo_url text,
  favicon_url text,
  stamp_url text,
  signature_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- --- Triggers ---
create or replace function public.touch_company_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_company_updated_at on public.companies;
create trigger trg_touch_company_updated_at
before update on public.companies
for each row
execute function public.touch_company_updated_at();

create or replace function public.refresh_site_employee_count(site_uuid uuid)
returns void
language plpgsql
as $$
begin
  update public.sites s
  set employee_count = (
    select count(*)::int
    from public.employees e
    where e.site_id = s.id
      and e.status <> 'INACTIVE'
  )
  where s.id = site_uuid;
end;
$$;

create or replace function public.sync_site_counts_from_employee_change()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    perform public.refresh_site_employee_count(new.site_id);
    return new;
  elsif tg_op = 'UPDATE' then
    if old.site_id is distinct from new.site_id then
      perform public.refresh_site_employee_count(old.site_id);
    end if;
    perform public.refresh_site_employee_count(new.site_id);
    return new;
  elsif tg_op = 'DELETE' then
    perform public.refresh_site_employee_count(old.site_id);
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_sync_site_counts_from_employee_change on public.employees;
create trigger trg_sync_site_counts_from_employee_change
after insert or update or delete on public.employees
for each row
execute function public.sync_site_counts_from_employee_change();

-- --- Helpful indexes ---
create index if not exists idx_employees_site_status on public.employees(site_id, status);
create index if not exists idx_employees_uan on public.employees(uan);
create index if not exists idx_salary_records_uan_month on public.salary_records(uan, month);
create index if not exists idx_sites_status on public.sites(status);

-- --- Row level security + permissive policies for development ---
alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.employees enable row level security;
alter table public.salary_records enable row level security;
alter table public.companies enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['users','sites','employees','salary_records','companies']
  loop
    execute format('drop policy if exists "%s_dev_all" on public.%I', t, t);
    execute format('create policy "%s_dev_all" on public.%I for all using (true) with check (true)', t, t);
  end loop;
end $$;

-- Optional seed company/profile row
insert into public.companies(name, address)
select 'Konark HRM', ''
where not exists (select 1 from public.companies);
