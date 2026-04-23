export interface Board {
  id: string
  user_id: string
  title: string
  created_at: string
}

export interface Column {
  id: string
  board_id: string
  title: string
  color: string
  position: number
  created_at: string
}

export interface Card {
  id: string
  column_id: string
  board_id: string
  title: string
  description: string
  position: number
  tags: string[]
  due_date: string | null
  assignee_name: string | null
  assignee_color: string | null
  created_at: string
  updated_at: string
}

export type TagType = 'feat' | 'bug' | 'design' | 'docs'

export const TAG_STYLES: Record<TagType, { label: string; bg: string; text: string }> = {
  feat:   { label: 'Feature', bg: 'rgba(59,130,246,0.2)',  text: '#60a5fa' },
  bug:    { label: 'Bug',     bg: 'rgba(244,63,94,0.2)',   text: '#fb7185' },
  design: { label: 'Design',  bg: 'rgba(168,85,247,0.2)',  text: '#c084fc' },
  docs:   { label: 'Docs',    bg: 'rgba(62,207,142,0.2)',  text: '#34d399' },
}

export const COLUMN_COLORS = [
  { value: '#3b82f6', label: 'Mavi' },
  { value: '#f5a623', label: 'Turuncu' },
  { value: '#a855f7', label: 'Mor' },
  { value: '#3ecf8e', label: 'Yeşil' },
  { value: '#f43f5e', label: 'Kırmızı' },
  { value: '#06b6d4', label: 'Cyan' },
]

export const AVATAR_COLORS = [
  '#7c6af7', '#3ecf8e', '#3b82f6', '#f5a623', '#f43f5e', '#a855f7', '#06b6d4'
]

/** Fractional indexing: yeni position hesapla */
export function calcPosition(before: number | null, after: number | null): number {
  if (before === null && after === null) return 1000
  if (before === null) return (after as number) / 2
  if (after === null) return before + 1000
  return (before + after) / 2
}
