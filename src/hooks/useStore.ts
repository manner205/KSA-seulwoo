import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type {
  EvidenceTrack, ActivityRecord, ScienceEvent,
  Milestone, Comment
} from '@/types/database'

export function useStore() {
  const { user } = useAuth()
  const familyId = user?.family_id

  const [evidenceTracks, setEvidenceTracks] = useState<EvidenceTrack[]>([])
  const [activities, setActivities]         = useState<ActivityRecord[]>([])
  const [events, setEvents]                 = useState<ScienceEvent[]>([])
  const [milestones, setMilestones]         = useState<Milestone[]>([])
  const [comments, setComments]             = useState<Comment[]>([])

  // ── 초기 데이터 로드 ────────────────────────────────
  useEffect(() => {
    if (!familyId) {
      setEvidenceTracks([])
      setActivities([])
      setEvents([])
      setMilestones([])
      setComments([])
      return
    }

    const fetchAll = async () => {
      const [ev, act, evt, ms, cmt] = await Promise.all([
        supabase.from('evidence_tracks')
          .select('*').eq('family_id', familyId).order('stage'),
        supabase.from('activity_records')
          .select('*').eq('family_id', familyId).order('created_at'),
        supabase.from('science_events')
          .select('*').eq('family_id', familyId).order('created_at'),
        supabase.from('milestones')
          .select('*').eq('family_id', familyId).order('target_date'),
        supabase.from('comments')
          .select('*').eq('family_id', familyId)
          .order('created_at', { ascending: false }),
      ])

      setEvidenceTracks((ev.data ?? []) as EvidenceTrack[])
      setActivities((act.data ?? []) as ActivityRecord[])
      setEvents((evt.data ?? []) as ScienceEvent[])
      setMilestones((ms.data ?? []) as Milestone[])
      setComments((cmt.data ?? []) as Comment[])
    }

    fetchAll()
  }, [familyId])

  // ── Evidence Tracks ─────────────────────────────────
  const updateEvidenceTrack = useCallback((
    id: string,
    patch: Partial<EvidenceTrack>
  ) => {
    const now = new Date().toISOString()
    setEvidenceTracks(prev => prev.map(t =>
      t.id === id ? { ...t, ...patch, updated_at: now } : t
    ))
    supabase.from('evidence_tracks')
      .update({ ...patch, updated_at: now })
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('updateEvidenceTrack:', error) })
  }, [])

  // ── Activities ──────────────────────────────────────
  const addActivity = useCallback((item: ActivityRecord) => {
    setActivities(prev => [...prev, item])
    supabase.from('activity_records').insert(item)
      .then(({ error }) => { if (error) console.error('addActivity:', error) })
  }, [])

  const updateActivity = useCallback((id: string, patch: Partial<ActivityRecord>) => {
    const now = new Date().toISOString()
    setActivities(prev => prev.map(a =>
      a.id === id ? { ...a, ...patch, updated_at: now } : a
    ))
    supabase.from('activity_records')
      .update({ ...patch, updated_at: now })
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('updateActivity:', error) })
  }, [])

  const deleteActivity = useCallback((id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id))
    supabase.from('activity_records').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteActivity:', error) })
  }, [])

  // ── Events ──────────────────────────────────────────
  const addEvent = useCallback((item: ScienceEvent) => {
    setEvents(prev => [...prev, item])
    supabase.from('science_events').insert(item)
      .then(({ error }) => { if (error) console.error('addEvent:', error) })
  }, [])

  const updateEvent = useCallback((id: string, patch: Partial<ScienceEvent>) => {
    const now = new Date().toISOString()
    setEvents(prev => prev.map(e =>
      e.id === id ? { ...e, ...patch, updated_at: now } : e
    ))
    supabase.from('science_events')
      .update({ ...patch, updated_at: now })
      .eq('id', id)
      .then(({ error }) => { if (error) console.error('updateEvent:', error) })
  }, [])

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id))
    supabase.from('science_events').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteEvent:', error) })
  }, [])

  // ── Comments ────────────────────────────────────────
  const addComment = useCallback((item: Comment) => {
    setComments(prev => [item, ...prev])
    supabase.from('comments').insert(item)
      .then(({ error }) => { if (error) console.error('addComment:', error) })
  }, [])

  const updateComment = useCallback((id: string, content: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, content } : c))
    supabase.from('comments').update({ content }).eq('id', id)
      .then(({ error }) => { if (error) console.error('updateComment:', error) })
  }, [])

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id))
    supabase.from('comments').delete().eq('id', id)
      .then(({ error }) => { if (error) console.error('deleteComment:', error) })
  }, [])

  return {
    evidenceTracks, updateEvidenceTrack,
    activities, addActivity, updateActivity, deleteActivity,
    events, addEvent, updateEvent, deleteEvent,
    milestones,
    comments, addComment, updateComment, deleteComment,
  }
}
