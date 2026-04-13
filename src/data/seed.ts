import type {
  Profile, EvidenceTrack, ActivityRecord,
  ScienceEvent, Milestone, Comment
} from '@/types/database'

// ── 가족 구성원 ──
export const FAMILY_ID = 'family-lee-001'

export const SEED_PROFILES: Profile[] = [
  {
    id: 'user-seulwoo',
    family_id: FAMILY_ID,
    email: 'seulwoo@family.kr',
    name: '이슬우',
    role: 'student',
    avatar_emoji: '🧑‍🔬',
    is_admin: false,
    created_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'user-dad',
    family_id: FAMILY_ID,
    email: 'dad@family.kr',
    name: '아빠',
    role: 'parent_dad',
    avatar_emoji: '👨‍💻',
    is_admin: false,
    created_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'user-mom',
    family_id: FAMILY_ID,
    email: 'mom@family.kr',
    name: '엄마',
    role: 'parent_mom',
    avatar_emoji: '👩‍🏫',
    is_admin: false,
    created_at: '2026-04-13T00:00:00Z',
  },
]

// ── 핵심 증빙자료 트랙 (3건) ──
export const SEED_EVIDENCE_TRACKS: EvidenceTrack[] = [
  {
    id: 'ev-1',
    family_id: FAMILY_ID,
    stage: 1,
    title: 'KSA 과학축전 연구 계획서',
    research_topic: '(연구 주제 입력 예정)',
    description: '증빙자료 1단계. 2026 KSASF 온라인 접수 제출.',
    target_period: '2026년 5월 4일 ~ 5월 9일 (온라인접수, 임시일정)',
    status: 'preparing',
    links: [],
    attachments: [],
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'ev-2',
    family_id: FAMILY_ID,
    stage: 2,
    title: '연구 주제 심화 활동 (2단계)',
    research_topic: '(1단계 결과 바탕으로 확장 예정)',
    description: '증빙자료 2단계. 올해 말 동일 연구 주제를 심화.',
    target_period: '2026년 하반기 (구체 일정 추후 확정)',
    status: 'planned',
    links: [],
    attachments: [],
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'ev-3',
    family_id: FAMILY_ID,
    stage: 3,
    title: '후속 심화 활동 / 산출물 (3단계)',
    research_topic: '(2단계 연장선으로 확장 예정)',
    description: '증빙자료 3단계. 내년 추가 심화 활동 또는 후속 산출물.',
    target_period: '2027년 (구체 일정 추후 확정)',
    status: 'planned',
    links: [],
    attachments: [],
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
]

// ── 기타 활동 기록 ──
export const SEED_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act-1',
    family_id: FAMILY_ID,
    title: '당동중학교 과학탐구 보고서',
    category: 'school_research',
    organization: '당동중학교',
    period: '2026년 3월 초',
    result: '(수상 여부 미정)',
    can_use_as_evidence: true,
    purpose: '교내 탐구 실적, 포트폴리오 보강',
    status: 'awaiting_result',
    attachments: [],
    created_at: '2026-03-05T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'act-2',
    family_id: FAMILY_ID,
    title: '동국대 영재교육원 생명과학',
    category: 'gifted_education',
    organization: '동국대학교 영재교육원',
    period: '2024년 ~ 현재 (3년째 재학)',
    result: '재학 중',
    can_use_as_evidence: true,
    purpose: '추천서/서류 활용, 장기 탐구 이력 증빙',
    status: 'completed',
    attachments: [],
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
]

// ── 과학 행사 ──
export const SEED_EVENTS: ScienceEvent[] = [
  {
    id: 'evt-1',
    family_id: FAMILY_ID,
    title: '2026 청소년 과학대장정 참가신청',
    description: '중학생 100명 내외 선발. 1분 지원 영상 제출 필요.',
    event_date: null,
    event_end_date: null,
    application_deadline: '2026-05-08T16:00:00+09:00',
    links: [
      { label: '온라인 접수', url: 'https://apply.kosac.re.kr/onlnRcpt/getBscInfo.do?pbancNo=2026-S669' },
    ],
    status: 'preparing',
    attachments: [],
    requires_video: true,
    is_conditional: false,
    condition_parent_id: null,
    preparation_notes: '지원서류 양식 다운로드, 1분 영상 촬영 필요',
    created_at: '2026-04-09T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'evt-2',
    family_id: FAMILY_ID,
    title: '2026 청소년 과학대장정 본행사 (3박 4일)',
    description: '국내 첨단 과학기술 연구소·기업·대학 탐방 체험 프로그램. 전액무료.',
    event_date: '2026-07-28',
    event_end_date: '2026-07-31',
    application_deadline: null,
    links: [],
    status: 'planned',
    attachments: [],
    requires_video: false,
    is_conditional: true,
    condition_parent_id: 'evt-1',
    preparation_notes: '참가신청 선발 시에만 활성화',
    created_at: '2026-04-13T00:00:00Z',
    updated_at: '2026-04-13T00:00:00Z',
  },
]

// ── 최종 마일스톤 ──
export const SEED_MILESTONES: Milestone[] = [
  {
    id: 'ms-1',
    family_id: FAMILY_ID,
    title: 'KSA 원서 접수',
    target_date: '2028-03-20',
    description: '장영실전형 원서 제출 최종 마감. 포트폴리오 완성 필수.',
    is_final: true,
    created_at: '2026-04-13T00:00:00Z',
  },
  {
    id: 'ms-2',
    family_id: FAMILY_ID,
    title: 'KSA 심층 구술 면접',
    target_date: '2028-06-23',
    description: '서류 합격 후 면접. 탐구 경험 기반 구술 준비.',
    is_final: true,
    created_at: '2026-04-13T00:00:00Z',
  },
]

// ── 초기 댓글 ──
export const SEED_COMMENTS: Comment[] = [
  {
    id: 'cmt-1',
    family_id: FAMILY_ID,
    parent_type: 'evidence_track',
    parent_id: 'ev-1',
    content: '과학축전 연구 계획서 주제를 이번 주 안에 정하자!',
    author_id: 'user-dad',
    author_name: '아빠',
    author_role: 'parent_dad',
    created_at: '2026-04-13T10:00:00Z',
  },
]
