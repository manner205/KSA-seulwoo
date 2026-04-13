# KSA 준비 - 개발일지

> **프로젝트명:** KSA 장영실전형 합격 도전 토탈 매니지먼트  
> **대상 학생:** 이슬우 (당동중학교 1학년, 동국대 영재교육원 생명과학 3년차)  
> **최종 목표:** 2028-03-20 KSA 원서 접수, 2028-06-23 심층 구술 면접  
> **최종 빌드 확인일:** 2026-04-13  
> **빌드 상태:** ✅ tsc + vite build 모두 통과

---

## 1. 프로젝트 개요

가족 3인(학생 이슬우, 아빠, 엄마)이 함께 사용하는 KSA 장영실전형 입시 포트폴리오 관리 웹앱.

### 핵심 기능
| 기능 | 설명 |
|------|------|
| **포트폴리오 로드맵** | 핵심 증빙자료 3건 + 기타 활동 관리 |
| **과학행사 일정** | 행사 등록/관리, D-Day 카운트다운, 조건부 이벤트 |
| **가족 댓글** | 모든 항목에 가족 구성원이 댓글 작성 가능 |
| **대시보드** | 2028 마일스톤 카운트다운, 긴급 마감 알림, 진행률 |
| **공유 메모** | 가족 간 자유 메모 (역할별 색상 구분) |
| **링크 관리** | 증빙자료/행사에 복수 링크 첨부 |
| **파일 첨부** | hwp/doc/pptx 등 문서 파일 첨부 (IndexedDB, 10MB×20개) |

### 3인 역할
- **아빠** = 개발자 (원격으로 Telegram+Cokacdir 통해 관리)
- **엄마** = 일정 탐색/등록 담당
- **슬우** = 연구/보고서 작성 담당

---

## 2. 기술 스택

| 구분 | 기술 | 버전 |
|------|------|------|
| **프레임워크** | React | 19.2 |
| **빌드 도구** | Vite | 8.0 |
| **타입 시스템** | TypeScript | 6.0 |
| **CSS** | Tailwind CSS (v4, @tailwindcss/vite 플러그인) | 4.2 |
| **라우팅** | react-router-dom | 7.14 |
| **아이콘** | lucide-react | 1.8 |
| **날짜** | date-fns (한국어 locale) | 4.1 |
| **DB (예정)** | Supabase (@supabase/supabase-js) | 2.103 |
| **현재 저장소** | localStorage (구조 데이터) + IndexedDB (파일 blob) | - |

### 경로 별칭
- `@/` → `./src/` (vite.config.ts + tsconfig.app.json에서 설정)

---

## 3. 디렉토리 구조

```
KSA-seulwoo/
├── index.html              # HTML 진입점 (lang=ko, 🚀 favicon)
├── package.json            # 의존성, 스크립트
├── vite.config.ts          # Vite + React + Tailwind + @/ alias
├── tsconfig.app.json       # TS 설정 (ignoreDeprecations: "6.0")
├── claude.me               # AI 개발 가이드라인 (3단계 구조)
├── .env.example            # Supabase 키 템플릿
│
└── src/
    ├── main.tsx            # 진입점 (StrictMode + App 렌더)
    ├── App.tsx             # AuthProvider → AppRouter 래핑
    ├── index.css           # Tailwind import + 디자인 토큰 + 상태 배지 색상
    ├── vite-env.d.ts       # Vite 타입 참조
    │
    ├── app/
    │   └── router.tsx      # BrowserRouter, 4개 라우트 + 로그인 보호
    │
    ├── types/
    │   └── database.ts     # 모든 타입 정의 (아래 4절 참조)
    │
    ├── data/
    │   └── seed.ts         # 초기 시드 데이터 (이슬우 가족)
    │
    ├── contexts/
    │   └── AuthContext.tsx  # localStorage 기반 인증 (3인 프로필 선택)
    │
    ├── hooks/
    │   └── useStore.ts     # localStorage CRUD 훅 (모든 엔티티)
    │
    ├── lib/
    │   ├── utils.ts        # formatDate, dDayLabel, isUrgent, STATUS_LABELS, generateId
    │   ├── fileStore.ts    # IndexedDB 파일 저장 (save/get/delete/download/validate)
    │   └── supabase.ts     # Supabase 클라이언트 (아직 미연결)
    │
    ├── components/
    │   ├── AppLayout.tsx   # 헤더 + 사이드바 + 모바일 하단 탭
    │   ├── DdayBadge.tsx   # D-Day 카운트다운 배지 (7일 이내 펄스)
    │   ├── StatusBadge.tsx # 7단계 상태 배지 (한국어)
    │   ├── LinkAdder.tsx   # 인라인 링크 추가 (행사용)
    │   └── FileAttachment.tsx # 파일 업로드/다운로드/삭제 UI
    │
    └── pages/
        ├── LoginPage.tsx       # 3인 역할 선택 로그인 (비밀번호 없음)
        ├── DashboardPage.tsx   # 메인 대시보드
        ├── RoadmapPage.tsx     # 포트폴리오 로드맵 (3개 섹션)
        ├── EventsPage.tsx      # 과학행사 일정 CRUD
        └── NotesPage.tsx       # 가족 공유 메모
```

---

## 4. 핵심 데이터 모델

### 4.1 상태 (ItemStatus) - 7단계
```
planned → preparing → submitted → awaiting_result → accepted / not_selected / completed
(예정)    (준비 중)   (제출 완료)   (결과 대기)       (선발/합격) (미선발)       (완료)
```

### 4.2 엔티티 관계
```
Profile (3인: student, parent_dad, parent_mom)
  └── family_id: "family-lee-001"

EvidenceTrack (핵심 증빙자료 3건 - 고정)
  ├── stage: 1 | 2 | 3
  ├── links: EventLink[]        ← 복수 링크
  ├── attachments: Attachment[]  ← 첨부파일
  └── comments (via parent_id)

ActivityRecord (기타 활동 - CRUD 가능)
  ├── category: 5종 (school_research, science_event, gifted_education, reading_presentation, other)
  ├── attachments: Attachment[]
  └── comments (via parent_id)

ScienceEvent (과학행사 - CRUD 가능)
  ├── links: EventLink[]
  ├── attachments: Attachment[]
  ├── is_conditional + condition_parent_id  ← 조건부 이벤트 (부모가 accepted일 때만 활성)
  └── comments (via parent_id)

Milestone (마일스톤 - 고정 2개)
  ├── 2028-03-20 KSA 원서 접수
  └── 2028-06-23 KSA 심층 구술 면접

Comment (댓글 - 모든 항목 + 일반 메모)
  ├── parent_type: evidence_track | activity_record | science_event | milestone | general
  └── author_role 기반 색상 구분
```

### 4.3 파일 첨부 시스템
- **메타데이터**: localStorage에 `Attachment` 객체로 저장 (id, filename, size, mime_type)
- **파일 blob**: IndexedDB `ksa-file-store` 데이터베이스에 ArrayBuffer로 저장
- **제한**: 파일당 10MB, 전체 20개
- **지원 형식**: .hwp, .hwpx, .doc, .docx, .ppt, .pptx, .pdf, .xls, .xlsx, .txt, .zip

---

## 5. 현재 데이터 저장 방식

모든 데이터는 **브라우저 로컬**에 저장됨 (Supabase 미연결):

| 키 | 내용 | 저장소 |
|----|------|--------|
| `ksa-evidence` | 핵심 증빙자료 3건 | localStorage |
| `ksa-activities` | 기타 활동 목록 | localStorage |
| `ksa-events` | 과학행사 목록 | localStorage |
| `ksa-milestones` | 마일스톤 2건 | localStorage |
| `ksa-comments` | 모든 댓글 | localStorage |
| `ksa-user` | 현재 로그인 사용자 | localStorage |
| `ksa-file-store` DB | 첨부파일 바이너리 | IndexedDB |

> ✅ **Phase 7 이후:** Supabase 연결로 가족 3인이 서로 다른 기기에서 실시간 데이터 공유 가능. localStorage는 더 이상 사용하지 않음.
> ⚠️ **파일 첨부는 예외:** IndexedDB의 파일 blob은 여전히 기기별 독립. Supabase Storage 연결 시 해결 예정.

---

## 6. 실행 방법

### 최초 설치 (다른 컴퓨터에서)
```bash
# Node.js 18+ 필요
cd KSA-seulwoo
npm install
```

### 개발 서버 실행
```bash
npm run dev
# → http://localhost:5173 에서 앱 실행
```

### 빌드
```bash
npm run build        # tsc + vite build
npm run preview      # 빌드 결과 미리보기
```

### TypeScript 검증만
```bash
npx tsc -b
```

---

## 7. 시드 데이터 (현재 등록된 항목)

### 핵심 증빙자료 3건
1. **1단계** - KSA 과학축전 연구 계획서 (상태: 준비 중)
   - 기간: 2026년 5월 4일~9일 (KSASF 온라인접수, 임시일정)
2. **2단계** - 연구 주제 심화 활동 (상태: 예정)
   - 기간: 2026년 하반기
3. **3단계** - 후속 심화 활동/산출물 (상태: 예정)
   - 기간: 2027년

### 기타 활동 2건
1. 당동중학교 과학탐구 보고서 (상태: 결과 대기)
2. 동국대 영재교육원 생명과학 (상태: 완료, 3년째 재학)

### 과학행사 2건
1. 2026 청소년 과학대장정 참가신청 (마감: 2026-05-08 16:00, 상태: 준비 중)
   - 🎬 1분 지원 영상 제출 필요
2. 2026 청소년 과학대장정 본행사 (2026-07-28~31, 조건부: 신청 선발 시 활성)

### 마일스톤 2건
1. 2028-03-20 KSA 원서 접수
2. 2028-06-23 KSA 심층 구술 면접

---

## 8. 개발 이력 (시간순)

### Phase 1: 프로젝트 초기 설정 (2026-04-13)
- Vite + React + TypeScript + Tailwind CSS v4 프로젝트 생성
- `@/` 경로 별칭 설정
- TypeScript 6.0 `ignoreDeprecations` 설정
- Supabase JS 클라이언트 설치 (아직 미연결)

### Phase 2: 핵심 구조 구현
- **타입 시스템**: `database.ts`에 모든 엔티티 타입 정의
- **시드 데이터**: 이슬우 가족 기본 데이터 (증빙자료 3건, 활동 2건, 행사 2건, 마일스톤 2건)
- **인증**: localStorage 기반 3인 프로필 선택 (AuthContext)
- **데이터 저장**: useLocalStorage 커스텀 훅 + useStore CRUD 훅
- **라우팅**: react-router-dom으로 4개 페이지 + 로그인 보호

### Phase 3: 4개 페이지 구현
- **LoginPage**: 3인 카드 선택 로그인 (비밀번호 없음)
- **DashboardPage**: 마일스톤 D-Day, 증빙자료 진행률, 긴급 마감, 최근 댓글
- **RoadmapPage**: 증빙자료 3건 + 기타 활동 CRUD + 과학행사 미러 표시
- **EventsPage**: 과학행사 CRUD, D-Day 배지, 조건부 이벤트
- **NotesPage**: 역할별 색상 구분 가족 메모

### Phase 4: 기능 추가 - 복수 링크
- EventLink[] 타입 추가
- 행사에 복수 링크 첨부 (LinkAdder 공용 컴포넌트)
- 증빙자료에도 링크 첨부 (EvidenceLinkAdder)
- 포트폴리오 페이지의 행사 섹션에서도 링크 표시/추가

### Phase 5: 기능 추가 - 댓글 시스템
- 모든 항목(증빙자료, 활동, 행사)에 인라인 댓글
- 일반 메모 (NotesPage)도 Comment 타입으로 통합
- Enter 키 전송, 역할별 색상

### Phase 6: 기능 추가 - 파일 첨부
- `Attachment` 타입 추가 (database.ts)
- `fileStore.ts`: IndexedDB 기반 파일 저장소 (save/get/delete/download/validate)
- `FileAttachment.tsx`: 파일 업로드/다운로드/삭제 UI 컴포넌트
- RoadmapPage: 증빙자료 3건 + 기타 활동 + 과학행사에 FileAttachment 통합
- EventsPage: 행사 카드에 FileAttachment 통합
- 전역 파일 수 제한 (totalFileCount) 계산 로직 추가

### Phase 7: Supabase 연결 (인증 + DB + RLS)
- `supabase/schema.sql`: 전체 DB 스키마 작성
  - 테이블 7개: families, profiles, evidence_tracks, activity_records, science_events, milestones, comments
  - Row Level Security (RLS) 정책 전체 적용 (family_id 기반 격리)
  - 헬퍼 함수: `get_my_family_id()`, `is_admin_user()`
  - 트리거: 회원가입 시 profile 자동 생성 (`handle_new_user`)
  - 시드 데이터: 이슬우 가족 초기 데이터 (가족, 증빙자료, 마일스톤, 기타 활동, 과학행사)
- `src/lib/supabase.ts`: Supabase 클라이언트 연결 (`createClient`)
- `src/hooks/useStore.ts`: localStorage → Supabase 실시간 쿼리로 전면 교체
  - 모든 CRUD (증빙자료, 활동, 행사, 댓글)가 Supabase 동기화
  - Optimistic UI 패턴 유지 (setState 먼저, Supabase는 비동기)
- **결과:** 가족 3인이 서로 다른 기기에서 실시간 데이터 공유 가능

### Phase 8: Vercel 배포
- `vercel.json` 추가: `pnpm run build`, outputDirectory `dist`, framework `vite`
- `dist/` 빌드 산출물 생성 확인
- **배포 URL:** https://ksa-seulwoo.vercel.app

### Phase 9: 링크 삭제 + 댓글 수정/삭제 (2026-04-14)
- `src/hooks/useStore.ts`: `updateComment`, `deleteComment` 함수 추가 (Supabase 동기화 포함)
- `src/components/LinkAdder.tsx`: 전면 재작성
  - 기존 링크 목록 표시 + 각 링크 옆 ✕ 삭제 버튼
  - 링크 추가 인라인 폼 유지
  - Props 변경: `(eventId, currentLinks, onUpdate)` → `(currentLinks, onUpdate: (links) => void)` (범용화)
- `src/pages/RoadmapPage.tsx`:
  - 증빙자료, 기타활동, 과학행사 링크 → LinkAdder로 통합 (별도 표시 코드 제거)
  - 인라인 `EvidenceLinkAdder` 컴포넌트 제거
  - 모든 댓글 섹션에 수정/삭제 버튼 추가 (hover 시 표시, 인라인 편집)
- `src/pages/EventsPage.tsx`:
  - LinkAdder로 링크 관리 통합
  - 댓글 수정/삭제 추가
- `src/pages/NotesPage.tsx`:
  - 각 메모 카드에 수정/삭제 버튼 추가
  - 수정 시 인라인 textarea 편집 모드로 전환

---

## 9. 알려진 이슈 & 주의사항

### 9.1 localStorage 데이터 마이그레이션
**스키마 변경 후 기존 데이터에 새 필드가 없는 문제가 반복됨.**

이전에 `links` 필드 추가 시 기존 localStorage 데이터에 `links`가 undefined여서 `LinkAdder` 저장 버튼이 동작하지 않았음. `Array.isArray()` 체크 + `[]` 폴백으로 해결.

**해결 패턴:**
```ts
// ❌ 위험: 기존 데이터에 attachments가 없으면 undefined
item.attachments.length

// ✅ 안전: 항상 Array.isArray 체크
const list = Array.isArray(item.attachments) ? item.attachments : []
```

**데이터 초기화가 필요한 경우** (브라우저 콘솔에서):
```js
localStorage.removeItem('ksa-evidence')
localStorage.removeItem('ksa-activities')
localStorage.removeItem('ksa-events')
// 새로고침하면 seed.ts 데이터로 재생성
```

### 9.2 파일 데이터 이동 불가
- IndexedDB 파일은 브라우저별로 독립 → USB로 복사해도 파일 blob은 이동 안 됨
- 파일 메타데이터(이름, 크기)만 localStorage에 남고, 실제 파일은 원래 컴퓨터에만 존재
- **Supabase Storage 연결 시 해결 예정**

### 9.3 Supabase 미연결
- `src/lib/supabase.ts` 파일은 존재하나, `.env` 파일에 키가 설정되어 있지 않음
- 현재 모든 데이터는 localStorage + IndexedDB에만 저장
- Supabase 연결 시 `useStore.ts`를 Supabase 쿼리로 교체해야 함

### 9.4 TypeScript 6.0 특이사항
- `baseUrl` 설정이 deprecated → `ignoreDeprecations: "6.0"` 필수
- `verbatimModuleSyntax: true` → `import type {}` 구문 사용 필수

---

## 10. 다음 개발 TODO (우선순위 순)

### 즉시 가능
- [ ] 증빙자료(EvidenceTrack) 편집 기능 (연구 주제, 설명, 기간 직접 수정)
- [ ] 활동(ActivityRecord) 결과(result) 입력 UI
- [ ] 행사 수정 기능 (현재 추가/삭제만 가능)
- [x] ~~댓글 삭제 기능~~ ✅ **완료** → Phase 9 참고 (수정도 함께 구현)
- [ ] 대시보드에 첨부파일 현황 표시

### 중기
- [x] ~~Supabase 연결~~ ✅ **완료** → Phase 7 참고
- [ ] fileStore.ts를 Supabase Storage로 교체 (현재 파일 blob은 IndexedDB에만 저장)
- [ ] 마감 알림 (이메일 또는 Telegram 봇)
- [ ] PWA (Progressive Web App) 설정 → 오프라인 + 홈화면 추가
- [ ] 모바일 UI 개선 (반응형 레이아웃 세부 조정)

### 장기
- [x] ~~배포 (Vercel)~~ ✅ **완료** → Phase 8 참고
- [ ] Telegram 봇 연동 (마감 알림 자동 전송)
- [ ] 연구 타임라인 시각화 (간트 차트)
- [ ] 연간 포트폴리오 리포트 PDF 출력

---

## 11. 다른 컴퓨터에서 이어서 개발할 때

### 사전 조건
1. **Node.js 18+** 설치 확인: `node -v`
2. **VS Code** + GitHub Copilot 확장 설치 권장

### 시작 절차
```bash
# 1. USB에서 프로젝트 폴더 복사 후
cd KSA-seulwoo

# 2. 의존성 설치 (node_modules는 USB에 포함하지 않아도 됨)
npm install

# 3. 빌드 확인
npx tsc -b

# 4. 개발 서버
npm run dev
```

### node_modules 포함 여부
- **USB 용량이 충분하면**: `node_modules` 포함 복사 → `npm install` 생략 가능
- **용량 절약하려면**: `node_modules` 제외 복사 → 대상 컴퓨터에서 `npm install` 실행

### AI에게 작업 지시 시 참고
이 문서(`DEV-LOG.md`)와 `claude.me` 파일을 읽게 한 후 작업 지시하면 프로젝트 맥락을 빠르게 파악할 수 있음.

```
이 프로젝트의 DEV-LOG.md와 claude.me를 읽고, [작업 내용]을 해줘.
```

---

## 12. 핵심 코드 패턴 요약

### 새 엔티티 추가 시 체크리스트
1. `src/types/database.ts`에 타입 추가
2. `src/data/seed.ts`에 시드 데이터 추가
3. `src/hooks/useStore.ts`에 CRUD 함수 추가
4. 페이지 컴포넌트에서 useStore() 구조분해로 사용
5. 기존 localStorage 데이터 초기화 필요 여부 확인

### 상태 업데이트 패턴
```tsx
// useStore.ts의 CRUD는 id + Partial patch 패턴 사용
updateEvidenceTrack(trackId, { status: 'completed' })
updateActivity(actId, { attachments: newAttachments })
updateEvent(evtId, { links: [...existingLinks, newLink] })
```

### 코멘트 추가 패턴
```tsx
addComment({
  id: generateId(),
  family_id: user.family_id,
  parent_type: 'evidence_track',  // 또는 activity_record, science_event, general
  parent_id: itemId,              // general이면 null
  content: text,
  author_id: user.id,
  author_name: user.name,
  author_role: user.role,
  created_at: new Date().toISOString(),
})
```

---

*이 문서는 2026-04-13 최초 작성, 2026-04-14 최종 업데이트 (Phase 9 반영)*
