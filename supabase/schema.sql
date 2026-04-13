-- =====================================================
-- KSA Family App - Supabase Schema
-- Supabase 대시보드 > SQL Editor > New query 에서 실행
-- =====================================================

-- ─────────────────────────────────────────────────────
-- 1. TABLES
-- ─────────────────────────────────────────────────────

-- 가족 그룹
create table if not exists public.families (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz default now()
);

-- 사용자 프로필 (auth.users 1:1 확장)
create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  family_id    uuid references public.families(id) on delete set null,
  email        text not null,
  name         text not null default '',
  role         text not null default 'parent_dad'
                 check (role in ('student', 'parent_dad', 'parent_mom')),
  avatar_emoji text not null default '👤',
  is_admin     boolean not null default false,
  created_at   timestamptz default now()
);

-- 핵심 증빙자료 트랙 (탐구활동 3단계)
create table if not exists public.evidence_tracks (
  id             uuid primary key default gen_random_uuid(),
  family_id      uuid not null references public.families(id) on delete cascade,
  stage          int not null check (stage in (1, 2, 3)),
  title          text not null,
  research_topic text not null default '',
  description    text not null default '',
  target_period  text not null default '',
  status         text not null default 'planned',
  links          jsonb not null default '[]'::jsonb,
  attachments    jsonb not null default '[]'::jsonb,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- 기타 활동 기록
create table if not exists public.activity_records (
  id                  uuid primary key default gen_random_uuid(),
  family_id           uuid not null references public.families(id) on delete cascade,
  title               text not null,
  category            text not null,
  organization        text not null default '',
  period              text not null default '',
  result              text not null default '',
  can_use_as_evidence boolean not null default false,
  purpose             text not null default '',
  status              text not null default 'planned',
  attachments         jsonb not null default '[]'::jsonb,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- 과학행사
create table if not exists public.science_events (
  id                   uuid primary key default gen_random_uuid(),
  family_id            uuid not null references public.families(id) on delete cascade,
  title                text not null,
  description          text not null default '',
  event_date           date,
  event_end_date       date,
  application_deadline timestamptz,
  links                jsonb not null default '[]'::jsonb,
  status               text not null default 'planned',
  attachments          jsonb not null default '[]'::jsonb,
  requires_video       boolean not null default false,
  is_conditional       boolean not null default false,
  condition_parent_id  uuid references public.science_events(id),
  preparation_notes    text not null default '',
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- 마일스톤
create table if not exists public.milestones (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  title       text not null,
  target_date date not null,
  description text not null default '',
  is_final    boolean not null default false,
  created_at  timestamptz default now()
);

-- 댓글 / 공유 메모
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  family_id   uuid not null references public.families(id) on delete cascade,
  parent_type text not null
                check (parent_type in (
                  'evidence_track','activity_record',
                  'science_event','milestone','general'
                )),
  parent_id   uuid,
  content     text not null,
  author_id   uuid references public.profiles(id) on delete set null,
  author_name text not null,
  author_role text not null,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────────────
-- 2. HELPER FUNCTIONS (security definer → RLS 우회)
-- ─────────────────────────────────────────────────────

-- 현재 로그인 유저의 is_admin 여부
create or replace function public.is_admin_user()
returns boolean
language sql security definer stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- 현재 로그인 유저의 family_id
create or replace function public.get_my_family_id()
returns uuid
language sql security definer stable
as $$
  select family_id from public.profiles where id = auth.uid();
$$;

-- ─────────────────────────────────────────────────────
-- 3. TRIGGER: 회원가입 시 profile 자동 생성
-- ─────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, name, role, avatar_emoji, is_admin, family_id
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name',
             split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'parent_dad'),
    coalesce(new.raw_user_meta_data->>'avatar_emoji', '👤'),
    -- manner205@gmail.com 은 자동으로 관리자
    new.email = 'manner205@gmail.com',
    nullif(new.raw_user_meta_data->>'family_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────
-- 4. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────

alter table public.families        enable row level security;
alter table public.profiles        enable row level security;
alter table public.evidence_tracks enable row level security;
alter table public.activity_records enable row level security;
alter table public.science_events  enable row level security;
alter table public.milestones      enable row level security;
alter table public.comments        enable row level security;

-- 기존 정책 삭제 후 재생성
do $$ begin
  drop policy if exists "families_select"   on public.families;
  drop policy if exists "families_insert"   on public.families;
  drop policy if exists "families_update"   on public.families;
  drop policy if exists "profiles_select"   on public.profiles;
  drop policy if exists "profiles_insert"   on public.profiles;
  drop policy if exists "profiles_update"   on public.profiles;
  drop policy if exists "profiles_delete"   on public.profiles;
  drop policy if exists "evidence_all"      on public.evidence_tracks;
  drop policy if exists "activities_all"    on public.activity_records;
  drop policy if exists "events_all"        on public.science_events;
  drop policy if exists "milestones_all"    on public.milestones;
  drop policy if exists "comments_all"      on public.comments;
exception when others then null;
end $$;

-- families
create policy "families_select" on public.families for select
  using (id = get_my_family_id() or is_admin_user());
create policy "families_insert" on public.families for insert
  with check (is_admin_user());
create policy "families_update" on public.families for update
  using (id = get_my_family_id() or is_admin_user());

-- profiles
create policy "profiles_select" on public.profiles for select
  using (
    id = auth.uid()
    or family_id = get_my_family_id()
    or is_admin_user()
  );
create policy "profiles_insert" on public.profiles for insert
  with check (id = auth.uid() or is_admin_user());
create policy "profiles_update" on public.profiles for update
  using (id = auth.uid() or is_admin_user());
create policy "profiles_delete" on public.profiles for delete
  using (is_admin_user());

-- 콘텐츠 테이블 (같은 family_id 또는 admin)
create policy "evidence_all" on public.evidence_tracks for all
  using      (family_id = get_my_family_id() or is_admin_user())
  with check (family_id = get_my_family_id() or is_admin_user());

create policy "activities_all" on public.activity_records for all
  using      (family_id = get_my_family_id() or is_admin_user())
  with check (family_id = get_my_family_id() or is_admin_user());

create policy "events_all" on public.science_events for all
  using      (family_id = get_my_family_id() or is_admin_user())
  with check (family_id = get_my_family_id() or is_admin_user());

create policy "milestones_all" on public.milestones for all
  using      (family_id = get_my_family_id() or is_admin_user())
  with check (family_id = get_my_family_id() or is_admin_user());

create policy "comments_all" on public.comments for all
  using      (family_id = get_my_family_id() or is_admin_user())
  with check (family_id = get_my_family_id() or is_admin_user());

-- ─────────────────────────────────────────────────────
-- 5. SEED DATA
-- 아래 순서대로 실행:
--   A) 앱에서 manner205@gmail.com 으로 먼저 회원가입
--   B) Supabase > Authentication > Settings >
--      "Enable email confirmations" 체크 해제 (선택, 이메일 인증 없이 바로 로그인)
--   C) 아래 시드 쿼리 실행
-- ─────────────────────────────────────────────────────

-- 가족 생성
insert into public.families (id, name) values
  ('10000000-0000-0000-0000-000000000001', '이슬우 가족 (KSA 장영실전형)')
on conflict (id) do nothing;

-- 관리자 프로필 업데이트 (회원가입 후 실행)
update public.profiles set
  family_id    = '10000000-0000-0000-0000-000000000001',
  name         = '아빠',
  role         = 'parent_dad',
  avatar_emoji = '👨‍💻',
  is_admin     = true
where email = 'manner205@gmail.com';

-- 증빙자료 트랙
insert into public.evidence_tracks
  (id, family_id, stage, title, research_topic, description, target_period, status)
values
  ('20000000-0000-0000-0000-000000000001',
   '10000000-0000-0000-0000-000000000001',
   1, 'KSA 과학축전 연구 계획서',
   '(연구 주제 입력 예정)',
   '증빙자료 1단계. 2026 KSASF 온라인 접수 제출.',
   '2026년 5월 4일 ~ 5월 9일 (온라인접수, 임시일정)',
   'preparing'),
  ('20000000-0000-0000-0000-000000000002',
   '10000000-0000-0000-0000-000000000001',
   2, '연구 주제 심화 활동 (2단계)',
   '(1단계 결과 바탕으로 확장 예정)',
   '증빙자료 2단계. 올해 말 동일 연구 주제를 심화.',
   '2026년 하반기 (구체 일정 추후 확정)',
   'planned'),
  ('20000000-0000-0000-0000-000000000003',
   '10000000-0000-0000-0000-000000000001',
   3, '후속 심화 활동 / 산출물 (3단계)',
   '(2단계 연장선으로 확장 예정)',
   '증빙자료 3단계. 내년 추가 심화 활동 또는 후속 산출물.',
   '2027년 (구체 일정 추후 확정)',
   'planned')
on conflict (id) do nothing;

-- 마일스톤
insert into public.milestones (family_id, title, target_date, description, is_final)
values
  ('10000000-0000-0000-0000-000000000001',
   'KSA 원서 접수', '2028-03-20',
   '장영실전형 원서 제출 최종 마감. 포트폴리오 완성 필수.', true),
  ('10000000-0000-0000-0000-000000000001',
   'KSA 심층 구술 면접', '2028-06-23',
   '서류 합격 후 면접. 탐구 경험 기반 구술 준비.', true)
on conflict do nothing;

-- 기타 활동
insert into public.activity_records
  (family_id, title, category, organization, period, result,
   can_use_as_evidence, purpose, status)
values
  ('10000000-0000-0000-0000-000000000001',
   '당동중학교 과학탐구 보고서', 'school_research', '당동중학교',
   '2026년 3월 초', '(수상 여부 미정)',
   true, '교내 탐구 실적, 포트폴리오 보강', 'awaiting_result'),
  ('10000000-0000-0000-0000-000000000001',
   '동국대 영재교육원 생명과학', 'gifted_education', '동국대 영재교육원',
   '2024년 ~ 현재 (3년째 재학)', '재학 중',
   true, '추천서/서류 활용, 장기 탐구 이력 증빙', 'completed')
on conflict do nothing;

-- 과학행사
insert into public.science_events
  (family_id, title, description, application_deadline,
   links, status, requires_video, is_conditional, preparation_notes)
values
  ('10000000-0000-0000-0000-000000000001',
   '2026 청소년 과학대장정 참가신청',
   '중학생 100명 내외 선발. 1분 지원 영상 제출 필요.',
   '2026-05-08T16:00:00+09:00',
   '[{"label":"온라인 접수","url":"https://apply.kosac.re.kr/onlnRcpt/getBscInfo.do?pbancNo=2026-S669"}]',
   'preparing', true, false,
   '지원서류 양식 다운로드, 1분 영상 촬영 필요')
on conflict do nothing;
