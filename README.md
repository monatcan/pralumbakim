# Konum Bazlı (QR) Varlık ve Bakım Yönetim Sistemi

## Proje Hakkında
Bu proje, kullanıcıların QR kodlar aracılığıyla varlık ve bakım işlemlerini yönetmelerini sağlayan hibrit bir SaaS sistemidir.
Saha personeli verimliliğini artırmayı ve müşterilere şeffaflık sağlamayı hedefler.

## Sistem zeti
- **Tetikleyici:** Şubedeki QR Kod.
- **Yönlendirme:** Şube detay sayfasına yönlendirme (`/sube/[id]`).

## Kullanıcı Rolleri
- **Süper Admin:** Müşteri ve firma yönetimi.
- **Proje Yöneticisi:** Tüm şubelerin genel durumu.
- **Şube Yetkilisi:** Kendi şubesinin geçmişi.
- **Saha Personeli:** Bakım girişi, checklist ve fotoğraf yükleme.

## Teknolojiler
- **Frontend:** Next.js (App Router), React
- **Styling:** Tailwind CSS
- **Veritabanı Erişim:** Prisma ORM
- **Veritabanı:** PostgreSQL (Destekli)
- **Kimlik Doğrulama:** NextAuth.js (Altyapı hazır)

## Kurulum Adımları
1. **Bağımlılıkları Yükleyin:**
   ```bash
   npm install
   ```

2. **evresel Değişkenler:**
   `.env` dosyasını oluşturun ve `DATABASE_URL` değişkenini tanımlayın (Prisma Postgres veya yerel Postgres).

3. **Veritabanı Kurulumu:**
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Uygulamayı Başlatın:**
   ```bash
   npm run dev
   ```

## Klasör Yapısı
- `src/app`: Next.js sayfaları ve API rotaları.
- `prisma`: Veritabanı şeması ve konfigürasyonu.
- `public`: Statik dosyalar.

## Geliştirme Notları
- Prisma şeması `prisma/schema.prisma` dosyasındadır.
- Veritabanı URLi `prisma.config.ts` aracılığıyla yönetilir.

