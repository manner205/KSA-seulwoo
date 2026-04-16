// ─── 공통 열거형 ────────────────────────────────────────
export type ItemStatus =
  | 'planned'
  | 'preparing'
  | 'submitted'
  | 'awaiting_result'
  | 'accepted'
  | 'not_selected'
  | 'completed'

export type UserRole = 'student' | 'parent_dad' | 'parent_mom'

export type ActivityCategory =
  | 'school_research'
  | 'science_event'
  | 'gifted_education'
  | 'reading_presentation'
  | 'other'

// ─── 앱 레벨 인터페이스 ─────────────────────────────────
export interface EventLink {
  label: string
  url: string
}

export interface Attachment {
  id: string
  filename: string
  size: number
  mime_type: string
  storage_path: string   // Supabase Storage 경로 (bucket 내 상대경로)
  created_at: string
}

export interface Profile {
  id: string
  family_id: string | null
  email: string
  name: string
  role: UserRole
  avatar_emoji: string
  is_admin: boolean
  created_at: string
}

export interface Family {
  id: string
  name: string
  created_at: string
}

export interface EvidenceTrack {
  id: string
  family_id: string
  stage: 1 | 2 | 3
  title: string
  research_topic: string
  description: string
  target_period: string
  status: ItemStatus
  links: EventLink[]
  attachments: Attachment[]
  created_at: string
  updated_at: string
}

export interface ActivityRecord {
  id: string
  family_id: string
  title: string
  category: ActivityCategory
  organization: string
  period: string
  result: string
  can_use_as_evidence: boolean
  purpose: string
  status: ItemStatus
  attachments: Attachment[]
  created_at: string
  updated_at: string
}

export interface ScienceEvent {
  id: string
  family_id: string
  title: string
  description: string
  event_date: string | null
  event_end_date: string | null
  application_deadline: string | null
  links: EventLink[]
  status: ItemStatus
  attachments: Attachment[]
  requires_video: boolean
  is_conditional: boolean
  condition_parent_id: string | null
  preparation_notes: string
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  family_id: string
  title: string
  target_date: string
  description: string
  is_final: boolean
  created_at: string
}

export interface Comment {
  id: string
  family_id: string
  parent_type: 'evidence_track' | 'activity_record' | 'science_event' | 'milestone' | 'general'
  parent_id: string | null
  content: string
  author_id: string
  author_name: string
  author_role: UserRole
  created_at: string
}

// ─── Supabase Database 타입 (createClient<Database> 용) ─
export interface Database {
  public: {
    Tables: {
      families: {
        Row: Family
        Insert: Omit<Family, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Family, 'id'>>
      }
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at'> & { created_at?: string }
        Update: Partial<Omit<Profile, 'id'>>
      }
      evidence_tracks: {
        Row: EvidenceTrack
        Insert: Omit<EvidenceTrack, 'created_at' | 'updated_at'> & {
          id?: string; created_at?: string; updated_at?: string
        }
        Update: Partial<Omit<EvidenceTrack, 'id'>>
      }
      activity_records: {
        Row: ActivityRecord
        Insert: Omit<ActivityRecord, 'created_at' | 'updated_at'> & {
          id?: string; created_at?: string; updated_at?: string
        }
        Update: Partial<Omit<ActivityRecord, 'id'>>
      }
      science_events: {
        Row: ScienceEvent
        Insert: Omit<ScienceEvent, 'created_at' | 'updated_at'> & {
          id?: string; created_at?: string; updated_at?: string
        }
        Update: Partial<Omit<ScienceEvent, 'id'>>
      }
      milestones: {
        Row: Milestone
        Insert: Omit<Milestone, 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Milestone, 'id'>>
      }
      comments: {
        Row: Comment
        Insert: Omit<Comment, 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Comment, 'id'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
