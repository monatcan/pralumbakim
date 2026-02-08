
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const session = await getServerSession(authOptions);
  
  // Only Super Admin or Project Manager can do this
  if (!session || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "PROJECT_MANAGER")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { clientId } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Dosya yüklenmedi" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse to JSON
    const data = XLSX.utils.sheet_to_json(sheet) as any[];

    if (!data || data.length === 0) {
        return NextResponse.json({ error: "Dosya boş veya okunamadı" }, { status: 400 });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
        // Expected columns: Name (or Şube Adı), Address (or Adres)
        const name = row["Name"] || row["name"] || row["Şube Adı"] || row["Sube Adi"] || row["Şube"] || row["Sube"];
        const address = row["Address"] || row["address"] || row["Adres"];

        if (name) {
            try {
                // Check if branch already exists for this client with same name? 
                // Creating duplicates might be intentional but let's just create.
                await prisma.branch.create({
                    data: {
                        name: String(name),
                        address: address ? String(address) : null,
                        clientId: clientId
                    }
                });
                successCount++;
            } catch (err) {
                console.error("Error creating branch:", name, err);
                errorCount++;
            }
        }
    }

    return NextResponse.json({ 
        success: true, 
        message: `${successCount} şube başarıyla eklendi.`,
        details: { successCount, errorCount }
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
