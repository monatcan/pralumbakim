
import { NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Dosya yüklenmedi' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    let buffer: Buffer = Buffer.from(bytes)

    // public/uploads klasörünü belirle
    const uploadDir = join(process.cwd(), 'public', 'uploads')
    
    // Klasör yoksa oluştur
    try {
        await mkdir(uploadDir, { recursive: true })
    } catch (e) {
        // Hata klasör zaten varsa ihmal edilebilir
    }

    // Dosya ismini temizle
    let cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
    
    // GÖRSEL OPTİMİZASYONU (Sadece resim dosyaları için)
    if (file.type.startsWith('image/')) {
        try {
            const imagePipeline = sharp(buffer).resize(1600, 1600, {
                fit: 'inside',
                withoutEnlargement: true
            });

            if (file.type === 'image/png') {
                buffer = await imagePipeline.png({ quality: 80 }).toBuffer();
                // Uzantıyı .png oldugundan emin ol
                if (!cleanName.toLowerCase().endsWith('.png')) {
                    cleanName = cleanName.replace(/\.[^/.]+$/, "") + ".png";
                }
            } else {
                buffer = await imagePipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
                // Uzantıyı .jpg olarak değiştir
                cleanName = cleanName.replace(/\.[^/.]+$/, "") + ".jpg";
            }
        } catch (error) {
            console.error("Optimizasyon hatası (orijinal dosya kaydedilecek):", error);
        }
    }

    // Benzersiz isim oluştur
    const fileName = `${Date.now()}-${cleanName}`
    const filePath = join(uploadDir, fileName)

    // Dosyayı yaz
    await writeFile(filePath, buffer)

    return NextResponse.json({ url: `/uploads/${fileName}` })
  } catch (error) {
    console.error("Upload Error:", error)
    return NextResponse.json({ error: 'Yükleme başarısız' }, { status: 500 })
  }
}
