
-- ENUMS
create type public.app_role as enum ('admin', 'user');
create type public.access_source as enum ('purchase', 'manual', 'bundle');
create type public.product_kind as enum ('course', 'bundle');
create type public.purchase_status as enum ('pending', 'paid', 'refunded', 'failed');

-- SHARED FUNCTIONS
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end;
$$;

-- USER_ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
create index idx_user_roles_user_id on public.user_roles(user_id);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "user_roles_admin_select" on public.user_roles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_insert" on public.user_roles for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_update" on public.user_roles for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "user_roles_admin_delete" on public.user_roles for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_self_or_admin" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles_insert_self_or_admin" on public.profiles for insert to authenticated with check (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles_update_self_or_admin" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role(auth.uid(), 'admin')) with check (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles_delete_admin" on public.profiles for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();

-- COURSES
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  cover_url text,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.courses to authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "courses_select_published_or_admin" on public.courses for select to authenticated using (is_published = true or public.has_role(auth.uid(), 'admin'));
create policy "courses_admin_insert" on public.courses for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "courses_admin_update" on public.courses for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "courses_admin_delete" on public.courses for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger courses_set_updated_at before update on public.courses for each row execute function public.set_updated_at();

-- COURSE_ACCESS (before lessons so lessons policy can reference it)
create table public.course_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source public.access_source not null,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create index idx_course_access_user on public.course_access(user_id);
create index idx_course_access_course on public.course_access(course_id);
grant select, insert, update, delete on public.course_access to authenticated;
grant all on public.course_access to service_role;
alter table public.course_access enable row level security;
create policy "course_access_select_self_or_admin" on public.course_access for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "course_access_admin_insert" on public.course_access for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "course_access_admin_update" on public.course_access for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "course_access_admin_delete" on public.course_access for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- LESSONS
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  vimeo_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lessons_course_sort on public.lessons(course_id, sort_order);
grant select, insert, update, delete on public.lessons to authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "lessons_select_with_access_or_admin" on public.lessons for select to authenticated
  using (
    public.has_role(auth.uid(), 'admin')
    or exists (select 1 from public.course_access ca where ca.user_id = auth.uid() and ca.course_id = lessons.course_id)
  );
create policy "lessons_admin_insert" on public.lessons for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "lessons_admin_update" on public.lessons for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "lessons_admin_delete" on public.lessons for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger lessons_set_updated_at before update on public.lessons for each row execute function public.set_updated_at();

-- BUNDLES
create table public.bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.bundles to authenticated;
grant all on public.bundles to service_role;
alter table public.bundles enable row level security;
create policy "bundles_admin_select" on public.bundles for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "bundles_admin_insert" on public.bundles for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "bundles_admin_update" on public.bundles for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "bundles_admin_delete" on public.bundles for delete to authenticated using (public.has_role(auth.uid(), 'admin'));
create trigger bundles_set_updated_at before update on public.bundles for each row execute function public.set_updated_at();

-- BUNDLE_COURSES
create table public.bundle_courses (
  bundle_id uuid not null references public.bundles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (bundle_id, course_id)
);
grant select, insert, update, delete on public.bundle_courses to authenticated;
grant all on public.bundle_courses to service_role;
alter table public.bundle_courses enable row level security;
create policy "bundle_courses_admin_select" on public.bundle_courses for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "bundle_courses_admin_insert" on public.bundle_courses for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "bundle_courses_admin_update" on public.bundle_courses for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "bundle_courses_admin_delete" on public.bundle_courses for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- LESSON_PROGRESS
create table public.lesson_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);
create index idx_lesson_progress_user on public.lesson_progress(user_id);
grant select, insert, update, delete on public.lesson_progress to authenticated;
grant all on public.lesson_progress to service_role;
alter table public.lesson_progress enable row level security;
create policy "lesson_progress_select_self_or_admin" on public.lesson_progress for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "lesson_progress_insert_self" on public.lesson_progress for insert to authenticated with check (user_id = auth.uid());
create policy "lesson_progress_update_self" on public.lesson_progress for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "lesson_progress_delete_self" on public.lesson_progress for delete to authenticated using (user_id = auth.uid());

-- PRODUCTS
create table public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  kind public.product_kind not null,
  course_id uuid references public.courses(id) on delete set null,
  bundle_id uuid references public.bundles(id) on delete set null,
  created_at timestamptz not null default now(),
  check (
    (kind = 'course' and course_id is not null and bundle_id is null)
    or (kind = 'bundle' and bundle_id is not null and course_id is null)
  )
);
grant select, insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "products_admin_select" on public.products for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_insert" on public.products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_update" on public.products for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_delete" on public.products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- PAYMENT_PROVIDERS
create table public.payment_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.payment_providers to authenticated;
grant all on public.payment_providers to service_role;
alter table public.payment_providers enable row level security;
create policy "payment_providers_admin_select" on public.payment_providers for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "payment_providers_admin_insert" on public.payment_providers for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "payment_providers_admin_update" on public.payment_providers for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "payment_providers_admin_delete" on public.payment_providers for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- PROVIDER_PRODUCTS
create table public.provider_products (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider_id uuid not null references public.payment_providers(id) on delete cascade,
  external_id text not null,
  created_at timestamptz not null default now(),
  unique (provider_id, external_id)
);
grant select, insert, update, delete on public.provider_products to authenticated;
grant all on public.provider_products to service_role;
alter table public.provider_products enable row level security;
create policy "provider_products_admin_select" on public.provider_products for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "provider_products_admin_insert" on public.provider_products for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "provider_products_admin_update" on public.provider_products for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "provider_products_admin_delete" on public.provider_products for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- PURCHASES (writes from service_role only)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.payment_providers(id) on delete restrict,
  provider_txn_id text not null,
  buyer_email text not null,
  product_id uuid references public.products(id) on delete set null,
  status public.purchase_status not null default 'pending',
  raw_payload jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider_id, provider_txn_id)
);
create index idx_purchases_buyer_email on public.purchases(buyer_email);
grant select on public.purchases to authenticated;
grant all on public.purchases to service_role;
alter table public.purchases enable row level security;
create policy "purchases_admin_select" on public.purchases for select to authenticated using (public.has_role(auth.uid(), 'admin'));
