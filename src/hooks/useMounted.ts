import { useEffect, useState } from 'react'

/**
 * dnd-kit sunucu tarafında ID üretmez, ancak client mount olduğunda
 * SortableContext ID'leri oluşturulur. Sunucu HTML'i ile client render'ı
 * arasındaki "hydration mismatch" hatasını önlemek için DndContext'i
 * yalnızca client mount olduktan sonra render ediyoruz.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  return mounted
}
