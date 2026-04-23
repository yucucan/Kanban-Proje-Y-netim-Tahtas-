# TaskFlow — Kanban Proje Yönetim Tahtası

Modern, dark-themed Kanban uygulaması. Next.js 14 + Supabase + dnd-kit.

## Özellikler
- Kullanıcı kaydı ve girişi (Supabase Auth)
- Çoklu pano yönetimi, varsayılan 4 sütun ile
- Sütun oluşturma, renk seçimi, sürükle-bırak sıralama
- Kart oluşturma/düzenleme: başlık, açıklama, etiket, son tarih, sorumlu
- **Fractional indexing** ile sayfa yenilemesinde sıralama korunur
- **Optimistic UI**: sürükleme anında yansır, Supabase arka planda güncellenir
- **Hydration fix**: `useMounted` hook ile dnd-kit/Next.js uyumu sağlanır
- dnd-kit ile pürüzsüz sürükle-bırak (mobil TouchSensor + DragOverlay dahil)
- Hata durumunda otomatik rollback
- Vercel'a tek komutla deploy

---

## 1. Supabase Kurulumu

1. [supabase.com](https://supabase.com) → "New project" oluşturun
2. **SQL Editor** → `supabase-schema.sql` dosyasını yapıştırıp çalıştırın
3. **Settings → API** → `Project URL` ve `anon public` key'i kopyalayın

---

## 2. Local Kurulum

```bash
npm install
cp .env.local.example .env.local
# .env.local içine Supabase URL ve key'i girin
npm run dev
```

→ http://localhost:3000

---

## 3. Vercel Deploy

### GitHub üzerinden (önerilen)
```bash
git init && git add . && git commit -m "initial"
# GitHub'da repo oluşturun, push edin
# Vercel → "Add New Project" → repo seçin → env variables ekleyin → Deploy
```

### Vercel CLI
```bash
npx vercel
```

Vercel'ın **Environment Variables** bölümüne `.env.local`'daki iki değeri ekleyin.

---

## Teknik Kararlar

### Sürükle-bırak: dnd-kit
- `react-beautiful-dnd` deprecated → `dnd-kit` aktif geliştirilen alternatif
- Modüler: `@dnd-kit/core` + `@dnd-kit/sortable` ayrı paketler
- Erişilebilirlik (a11y) standartlarına uyumlu
- `TouchSensor` (delay: 250ms) → mobil kaydırma ile çakışmayı önler
- `DragOverlay` → sürükleme sırasında görsel kopya (scale + opacity efekti)

### Sıralama: Fractional Indexing
Her kartın `position` alanı float. A ve B kartları arasına kart sürüklendiğinde:
```
newPosition = (A.position + B.position) / 2
```
Sadece **1 kayıt** güncellenir. Tüm sıralama yeniden hesaplanmaz.

### Optimistic UI
```
1. setCards(...) → state anında güncellenir, kullanıcı beklemez
2. supabase.update() → arka planda çalışır
3. error? → setCards(previousCards) rollback
```

### Hydration Mismatch Fix
```tsx
// useMounted hook
const mounted = useMounted()
// DndContext yalnızca client mount sonrası render edilir
{mounted ? <DndContext>...</DndContext> : <StaticSkeleton />}
```

### Güvenlik: Row Level Security
Her kullanıcı yalnızca kendi panolarını okuyup yazabilir.
Pano silindiğinde sütun ve kartlar cascade ile otomatik temizlenir.
