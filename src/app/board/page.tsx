import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import { Board, Column, Card } from '@/types'
import KanbanApp from '@/components/board/KanbanApp'

export default async function BoardPage({
  searchParams,
}: {
  searchParams: { boardId?: string }
}) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth')

  // Fetch boards
  const { data: boards } = await supabase
    .from('boards')
    .select('*')
    .order('created_at', { ascending: true })

  let currentBoardId = searchParams.boardId

  // If no boardId param, use first board or null
  if (!currentBoardId && boards && boards.length > 0) {
    currentBoardId = boards[0].id
  }

  let columns: Column[] = []
  let cards: Card[] = []

  if (currentBoardId) {
    const { data: colData } = await supabase
      .from('columns')
      .select('*')
      .eq('board_id', currentBoardId)
      .order('position', { ascending: true })

    const { data: cardData } = await supabase
      .from('cards')
      .select('*')
      .eq('board_id', currentBoardId)
      .order('position', { ascending: true })

    columns = colData || []
    cards = cardData || []
  }

  return (
    <KanbanApp
      user={{ id: user.id, email: user.email!, name: user.user_metadata?.full_name || user.email! }}
      boards={(boards || []) as Board[]}
      initialColumns={columns}
      initialCards={cards}
      currentBoardId={currentBoardId || null}
    />
  )
}
