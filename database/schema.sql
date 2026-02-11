-- Konark HR & Salary Management System (Standard Edition v1.2)
-- WARNING: This script DROPS existing app DB objects before recreating from scratch.

create extension if not exists "pgcrypto";

-- =========================================================
-- 1) DROP OLD OBJECTS
-- =========================================================
drop trigger if exists trg_touch_company_updated_at on public.companies;
drop trigger if exists trg_sync_site_counts_from_employee_change on public.employees;

drop function if exists public.touch_company_updated_at();
drop function if exists public.touch_updated_at();
drop function if exists public.refresh_site_employee_count(uuid);
drop function if exists public.sync_site_counts_from_employee_change();
drop function if exists public.hr_login(text, text);
drop function if exists public.hr_login(text, text, text);
drop function if exists public.upsert_employee(varchar, text, varchar, text, uuid, text, text, text, text, uuid);
drop function if exists public.upsert_salary(uuid, varchar, integer, numeric, numeric, numeric, numeric, integer, uuid, boolean);
drop function if exists public.write_audit_log(text, text, uuid, jsonb, uuid);

drop table if exists public.hr_sessions cascade;
drop table if exists public.audit_logs cascade;
drop table if exists public.salary_records cascade;
drop table if exists public.employees cascade;
drop table if exists public.sites cascade;
drop table if exists public.users cascade;
drop table if exists public.companies cascade;

drop type if exists public.user_role cascade;
drop type if exists public.employee_status cascade;
drop type if exists public.record_status cascade;

-- =========================================================
-- 2) ENUMS
-- =========================================================
create type public.user_role as enum ('HR_ADMIN', 'SITE_INCHARGE', 'EMPLOYEE');
create type public.employee_status as enum ('PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'INACTIVE');
create type public.record_status as enum ('ACTIVE', 'INACTIVE');

-- =========================================================
-- 3) CORE TABLES
-- =========================================================
create table public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  role public.user_role not null default 'HR_ADMIN',
  password_hash text not null,
  is_active boolean not null default true,
  failed_login_attempts integer not null default 0,
  locked_until timestamptz,
  last_login_at timestamptz,
  last_login_ip text,
  password_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  address text not null,
  incharge_id uuid null,
  employee_count integer not null default 0,
  status public.record_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.employees (
  id uuid primary key default gen_random_uuid(),
  uan varchar(12) not null unique,
  name text not null,
  mobile varchar(15) not null,
  role text not null,
  site_id uuid not null references public.sites(id) on delete restrict,
  status public.employee_status not null default 'PENDING',
  joined_date date not null default current_date,
  bank_name text,
  account_number text,
  ifsc text,
  basic_salary numeric(12,2),
  photo_url text,
  aadhaar_url text,
  pan_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_uan_digits check (uan ~ '^\d{12}$')
);

create table public.salary_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  employee_name text not null,
  uan varchar(12) not null,
  month varchar(7) not null,
  year integer not null,
  basic numeric(12,2) not null default 0,
  hra numeric(12,2) not null default 0,
  allowances numeric(12,2) not null default 0,
  deductions numeric(12,2) not null default 0,
  net_payable numeric(12,2) generated always as ((basic + hra + allowances) - deductions) stored,
  paid_days integer not null default 0,
  is_locked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint salary_records_month_fmt check (month ~ '^(0[1-9]|1[0-2])-\d{4}$'),
  constraint salary_records_unique_emp_month unique (employee_id, month)
);

create table public.companies (
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

create table public.audit_logs (
  id bigserial primary key,
  action text not null,
  table_name text not null,
  record_id uuid,
  payload jsonb,
  actor_id uuid,
  created_at timestamptz not null default now()
);

create table public.hr_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  session_token text not null unique,
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

alter table public.sites add constraint fk_sites_incharge_id foreign key (incharge_id) references public.employees(id) on delete set null;

-- =========================================================
-- 4) UTILITY FUNCTIONS + TRIGGERS
-- =========================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create or replace function public.write_audit_log(
  p_action text,
  p_table_name text,
  p_record_id uuid,
  p_payload jsonb,
  p_actor_id uuid
)
returns void
language plpgsql
as $$
begin
  insert into public.audit_logs(action, table_name, record_id, payload, actor_id)
  values (p_action, p_table_name, p_record_id, p_payload, p_actor_id);
end;
$$;

create trigger trg_users_touch_updated_at
before update on public.users
for each row
execute function public.touch_updated_at();

create trigger trg_sites_touch_updated_at
before update on public.sites
for each row
execute function public.touch_updated_at();

create trigger trg_employees_touch_updated_at
before update on public.employees
for each row
execute function public.touch_updated_at();

create trigger trg_salary_records_touch_updated_at
before update on public.salary_records
for each row
execute function public.touch_updated_at();

create trigger trg_touch_company_updated_at
before update on public.companies
for each row
execute function public.touch_updated_at();

create trigger trg_sync_site_counts_from_employee_change
after insert or update or delete on public.employees
for each row
execute function public.sync_site_counts_from_employee_change();

-- =========================================================
-- 5) RPC FUNCTIONS (APP CONTRACT)
-- =========================================================
create or replace function public.hr_login(p_email text, p_password text, p_client_ip text default null)
returns table (id uuid, name text, email text, role public.user_role)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_user public.users;
  v_is_password_valid boolean;
  v_attempts integer;
  v_session_token text;
begin
  select * into v_user
  from public.users
  where lower(users.email) = lower(p_email)
    and users.role = 'HR_ADMIN'
  limit 1
  for update;

  if v_user.id is null then
    perform public.write_audit_log('LOGIN_FAILED', 'users', null, jsonb_build_object('email', p_email, 'reason', 'USER_NOT_FOUND'), null);
    return;
  end if;

  if not v_user.is_active then
    perform public.write_audit_log('LOGIN_FAILED', 'users', v_user.id, jsonb_build_object('reason', 'USER_INACTIVE'), v_user.id);
    return;
  end if;

  if v_user.locked_until is not null and v_user.locked_until > now() then
    perform public.write_audit_log('LOGIN_BLOCKED', 'users', v_user.id, jsonb_build_object('reason', 'ACCOUNT_LOCKED', 'locked_until', v_user.locked_until), v_user.id);
    return;
  end if;

  v_is_password_valid := v_user.password_hash = crypt(p_password, v_user.password_hash);

  if not v_is_password_valid then
    v_attempts := v_user.failed_login_attempts + 1;

    update public.users
    set failed_login_attempts = v_attempts,
        locked_until = case when v_attempts >= 5 then now() + interval '15 minutes' else null end,
        last_login_ip = p_client_ip
    where users.id = v_user.id;

    perform public.write_audit_log(
      'LOGIN_FAILED',
      'users',
      v_user.id,
      jsonb_build_object(
        'reason', 'INVALID_PASSWORD',
        'attempt', v_attempts,
        'locked', v_attempts >= 5
      ),
      v_user.id
    );
    return;
  end if;

  update public.users
  set failed_login_attempts = 0,
      locked_until = null,
      last_login_at = now(),
      last_login_ip = p_client_ip
  where users.id = v_user.id;

  v_session_token := encode(gen_random_bytes(32), 'hex');
  insert into public.hr_sessions(user_id, session_token, expires_at)
  values (v_user.id, v_session_token, now() + interval '8 hours');

  perform public.write_audit_log('LOGIN_SUCCESS', 'users', v_user.id, jsonb_build_object('ip', p_client_ip, 'session_token', v_session_token), v_user.id);

  return query
  select u.id, u.name, u.email, u.role
  from public.users u
  where u.id = v_user.id;
end;
$$;

create or replace function public.upsert_employee(
  p_uan varchar,
  p_name text,
  p_mobile varchar,
  p_role text,
  p_site_id uuid,
  p_bank_name text default null,
  p_account_number text default null,
  p_ifsc text default null,
  p_photo_url text default null,
  p_actor_id uuid default null
)
returns setof public.employees
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_row public.employees;
begin
  insert into public.employees(
    uan, name, mobile, role, site_id, status, bank_name, account_number, ifsc, photo_url
  )
  values (
    p_uan, p_name, p_mobile, p_role, p_site_id, 'PENDING', p_bank_name, p_account_number, p_ifsc, p_photo_url
  )
  on conflict (uan) do update
  set name = excluded.name,
      mobile = excluded.mobile,
      role = excluded.role,
      site_id = excluded.site_id,
      bank_name = excluded.bank_name,
      account_number = excluded.account_number,
      ifsc = excluded.ifsc,
      photo_url = excluded.photo_url,
      updated_at = now()
  returning * into v_row;

  perform public.write_audit_log('UPSERT', 'employees', v_row.id, to_jsonb(v_row), p_actor_id);

  return next v_row;
end;
$$;

create or replace function public.upsert_salary(
  p_employee_id uuid,
  p_month varchar,
  p_year integer,
  p_basic numeric,
  p_hra numeric,
  p_allowances numeric,
  p_deductions numeric,
  p_paid_days integer,
  p_actor_id uuid default null,
  p_is_locked boolean default true
)
returns setof public.salary_records
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_emp record;
  v_row public.salary_records;
begin
  select id, name, uan into v_emp
  from public.employees
  where id = p_employee_id;

  if v_emp.id is null then
    raise exception 'Employee not found for id %', p_employee_id;
  end if;

  insert into public.salary_records(
    employee_id, employee_name, uan, month, year,
    basic, hra, allowances, deductions, paid_days, is_locked
  )
  values (
    v_emp.id, v_emp.name, v_emp.uan, p_month, p_year,
    p_basic, p_hra, p_allowances, p_deductions, p_paid_days, p_is_locked
  )
  on conflict (employee_id, month) do update
  set basic = excluded.basic,
      hra = excluded.hra,
      allowances = excluded.allowances,
      deductions = excluded.deductions,
      paid_days = excluded.paid_days,
      is_locked = excluded.is_locked,
      updated_at = now()
  returning * into v_row;

  perform public.write_audit_log('UPSERT', 'salary_records', v_row.id, to_jsonb(v_row), p_actor_id);

  return next v_row;
end;
$$;

-- =========================================================
-- 6) INDEXES
-- =========================================================
create index idx_employees_site_status on public.employees(site_id, status);
create index idx_employees_uan on public.employees(uan);
create index idx_salary_records_uan_month on public.salary_records(uan, month);
create index idx_sites_status on public.sites(status);
create index idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index idx_users_email_role on public.users(lower(email), role);
create index idx_users_login_lock on public.users(locked_until);
create index idx_hr_sessions_user_expires on public.hr_sessions(user_id, expires_at);

-- =========================================================
-- 7) RLS (STANDARD, SITE-SCOPED)
-- =========================================================
alter table public.users enable row level security;
alter table public.sites enable row level security;
alter table public.employees enable row level security;
alter table public.salary_records enable row level security;
alter table public.companies enable row level security;
alter table public.audit_logs enable row level security;
alter table public.hr_sessions enable row level security;

-- NOTE: This project currently uses a client key without Supabase Auth identities.
-- To keep app functional in this mode, permissive policies are applied.
create policy users_dev_all on public.users for all using (true) with check (true);
create policy sites_dev_all on public.sites for all using (true) with check (true);
create policy employees_dev_all on public.employees for all using (true) with check (true);
create policy salary_records_dev_all on public.salary_records for all using (true) with check (true);
create policy companies_dev_all on public.companies for all using (true) with check (true);
create policy audit_logs_dev_all on public.audit_logs for all using (true) with check (true);
create policy hr_sessions_dev_all on public.hr_sessions for all using (true) with check (true);

-- =========================================================
-- 8) SEED DATA
-- =========================================================
insert into public.companies(name, address)
values ('Konark HRM', '');

-- Seed initial HR Admin user with a random password that MUST be reset/rotated after deployment.
insert into public.users(name, email, role, password_hash)
values (
  'HR Admin',
  'admin@konark.com',
  'HR_ADMIN',
  crypt(gen_random_uuid()::text, gen_salt('bf'))
);
