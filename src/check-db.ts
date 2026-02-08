import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('Veritabanı bağlantısı kontrol ediliyor...')
    
    // Tabloların varlığını basit bir sorgu ile test edelim
    const userCount = await prisma.user.count()
    console.log(`✅ User tablosu bulundu. Kayıt sayısı: ${userCount}`)
    
    const clientCount = await prisma.client.count()
    console.log(`✅ Client tablosu bulundu. Kayıt sayısı: ${clientCount}`)
    
    const branchCount = await prisma.branch.count()
    console.log(`✅ Branch tablosu bulundu. Kayıt sayısı: ${branchCount}`)

    console.log('\nSONUÇ: Tablolar veritabanında mevcut ve erişilebilir.')
  } catch (e) {
    console.error('\nHATA: Tablolara erişilemedi.')
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()