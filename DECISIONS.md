# TaskFlow — Teknik Kararlar ve 48 Saatlik Süreç

## 48 Saatte Neye Odaklandım?

Temel prensibi şu şekilde belirledim: **"Bir özellik ya kusursuz çalışır, ya da hiç eklenmez."**

Bu yüzden şu özellikleri **tamamladım:**
- Sürükle-bırak (kart + sütun) — sayfa yenilemesinde sıralama korunuyor
- Kullanıcı kaydı ve girişi (Supabase Auth)
- Çoklu pano yönetimi
- Kart detayları: başlık, açıklama, etiket, son tarih, sorumlu kişi
- Optimistic UI + hata durumunda rollback
- Mobil uyumluluk (TouchSensor)
- Vercel deploy

Şu özellikleri **bilinçli olarak dışarıda bıraktım:**
- Board paylaşma / ortak düzenleme → WebSocket/Realtime gerektirir, 48 saatte yarım kalırdı
- Aktivite geçmişi UI → veri modeli hazır ama görüntüleme ekranı yapılmadı
- Bildirimler, yorum sistemi → kapsam sürünmesi yaratırdı

---

## Sürükle-Bırak Kütüphanesi: Neden `dnd-kit`?

| Kütüphane | Durum | Mobil | Boyut | Karar |
|---|---|---|---|---|
| `react-beautiful-dnd` | ❌ Deprecated | Zayıf | Orta | Elendi |
| `@hello-pangea/dnd` | ✅ Fork, aktif | Orta | Orta | Alternatif |
| `SortableJS` | ✅ Aktif | İyi | Küçük | React entegrasyonu zayıf |
| `dnd-kit` | ✅ Aktif | ✅ TouchSensor | Küçük | **Seçildi** |

**`dnd-kit` seçilme gerekçeleri:**
- `react-beautiful-dnd` resmi olarak deprecated — production'da kullanılmamalı
- Modüler yapı: `@dnd-kit/core` + `@dnd-kit/sortable` ayrı paketler, sadece ihtiyaç duyulan yüklenir
- `TouchSensor` ile mobil desteği yerleşik gelir; `delay: 250ms` ile sayfa kaydırma ile çakışma önlenir
- `DragOverlay` ile sürükleme sırasında görsel kopya (scale + opacity efekti) kolayca eklenir
- Erişilebilirlik (a11y) standartlarına uyumlu, `KeyboardSensor` ile klavye desteği

---

## Sıralama Verisi: Fractional Indexing

**Sorun:** Kartların sırasını `0, 1, 2, 3` gibi tam sayılarla saklamak, araya kart eklendiğinde tüm kartların güncellenmesini gerektirir. 100 kart varsa 100 UPDATE sorgusu gider.

**Çözüm: Fractional Indexing**

Her kartın `position` alanı `float`. İki kart arasına yeni kart eklendiğinde:

```
newPosition = (A.position + B.position) / 2
```

Örnek:
```
Kart A: position = 1000
Kart B: position = 2000
Araya eklenen: position = 1500  ← sadece bu 1 kayıt yazılır
```

**Sonuç:** Tek bir `UPDATE` sorgusu. Diğer tüm kartlar olduğu gibi kalır. Sayfa yenilendiğinde `position`'a göre sıralama yapılır, sıralama hiç kaybolmaz.

Uygulamada `arrayMove` (dnd-kit) ile yeni index hesaplanır, ardından o indexin komşu kartlarının `position` ortalaması alınır.

---

## Optimistic UI

Kullanıcı kartı bıraktığında Supabase'i beklemeden state anında güncellenir:

```
1. setCards(...)        → UI anında güncellenir, kullanıcı beklemez
2. supabase.update()    → arka planda çalışır
3. error? → setCards(previousCards)  → rollback + toast mesajı
```

Bu sayede ağ gecikmesi olsa bile arayüz donmaz.

---

## Mobil Kullanılabilirlik

- `TouchSensor` ile `delay: 250ms, tolerance: 5px` — kısa dokunuş kaydırma yapar, uzun basış sürükleme başlatır
- Tüm sütunlar yatay scroll ile erişilebilir
- Modal'lar `max-height: 90vh` + scroll ile küçük ekranlarda kullanılabilir
- Responsive tasarım: 600px altında sütun genişliği 240px'e düşer

---

## Hydration Mismatch Çözümü

Next.js Server Components HTML üretirken `dnd-kit` ID'leri mevcut değildir. Bu durum React'ın "hydration mismatch" hatasına yol açar.

**Çözüm:** `useMounted` hook ile `DndContext` yalnızca client mount olduktan sonra render edilir. Mount öncesinde aynı görünen statik bir iskelet gösterilir — layout shift olmaz.

```tsx
const mounted = useMounted()
// ...
{mounted ? <DndContext>...</DndContext> : <StaticSkeleton />}
```

---

## Veri Modeli

```
boards
  └── id, user_id, title, created_at

columns
  └── id, board_id, title, color, position (float)

cards
  └── id, board_id, column_id, title, description,
      position (float), tags[], due_date, assignee_name, assignee_color
```

- `board_id` cascade delete → pano silinince sütun ve kartlar otomatik temizlenir
- Row Level Security → her kullanıcı yalnızca kendi verilerini okuyup yazabilir
- `position` float → fractional indexing ile tek kayıt güncellenir

---

## Tech Stack

| Katman | Teknoloji | Gerekçe |
|---|---|---|
| Framework | Next.js 14 (App Router) | Server component + SSR ile ilk veri hızlı gelir |
| Stil | Tailwind CSS + inline styles | Hızlı prototipleme |
| Sürükle-bırak | dnd-kit | Aktif geliştirme, mobil destek, a11y |
| Backend | Supabase (PostgreSQL) | Auth + DB + RLS hazır, sıfır backend kodu |
| Deploy | Vercel | Next.js ile kusursuz entegrasyon |
