import { NextResponse } from 'next/server';
import { db, motorModels, armadaUnits } from '@/lib/db';
import { asc, eq, sql } from 'drizzle-orm';

export async function GET() {
  try {
    const models = await db
      .select({
        id: motorModels.id,
        namaModel: motorModels.namaModel,
        kategori: motorModels.kategori,
        harga1Hari: motorModels.harga1Hari,
        harga1Minggu: motorModels.harga1Minggu,
        harga2Minggu: motorModels.harga2Minggu,
        harga12Jam: motorModels.harga12Jam,
        harga9Jam: motorModels.harga9Jam,
        harga6Jam: motorModels.harga6Jam,
        harga3Jam: motorModels.harga3Jam,
        dendaHarianPerJam: motorModels.dendaHarianPerJam,
        fasilitas: motorModels.fasilitas,
        spesifikasi: motorModels.spesifikasi,
        imageUrl: motorModels.imageUrl,
        isActive: motorModels.isActive,
        createdAt: motorModels.createdAt,
        totalUnits: sql<number>`cast(count(${armadaUnits.id}) as integer)`,
      })
      .from(motorModels)
      .leftJoin(armadaUnits, eq(armadaUnits.motorId, motorModels.id))
      .groupBy(motorModels.id)
      .orderBy(asc(motorModels.id));

    return NextResponse.json({ success: true, data: models });
  } catch (error: any) {
    console.error('Error fetching motor models:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      namaModel,
      kategori,
      harga1Hari,
      harga1Minggu,
      harga2Minggu,
      harga12Jam,
      harga9Jam,
      harga6Jam,
      harga3Jam,
      dendaHarianPerJam,
      fasilitas,
      spesifikasi,
      imageUrl,
    } = body;

    if (!namaModel || !kategori || !harga1Hari) {
      return NextResponse.json(
        { success: false, error: 'Nama model, kategori, dan tarif 1 hari wajib diisi' },
        { status: 400 }
      );
    }

    // Normalisasi dan pembulatan ribuan (multi-tier calculation)
    const h1Hari = Math.round(Number(harga1Hari) / 1000) * 1000;
    const h1Minggu = harga1Minggu ? Math.round(Number(harga1Minggu) / 1000) * 1000 : Math.round((h1Hari * 6) / 1000) * 1000;
    const h2Minggu = harga2Minggu ? Math.round(Number(harga2Minggu) / 1000) * 1000 : Math.round((h1Hari * 11) / 1000) * 1000;
    const h12Jam = harga12Jam ? Math.round(Number(harga12Jam) / 1000) * 1000 : Math.round((h1Hari * 0.75) / 1000) * 1000;
    const h9Jam = harga9Jam ? Math.round(Number(harga9Jam) / 1000) * 1000 : Math.round((h1Hari * 0.65) / 1000) * 1000;
    const h6Jam = harga6Jam ? Math.round(Number(harga6Jam) / 1000) * 1000 : Math.round((h1Hari * 0.50) / 1000) * 1000;
    const h3Jam = harga3Jam ? Math.round(Number(harga3Jam) / 1000) * 1000 : Math.round((h1Hari * 0.35) / 1000) * 1000;
    const dendaJam = dendaHarianPerJam ? Math.round(Number(dendaHarianPerJam) / 1000) * 1000 : 20000;

    const [newModel] = await db
      .insert(motorModels)
      .values({
        namaModel: namaModel.trim(),
        kategori: kategori.trim(),
        harga1Hari: h1Hari,
        harga1Minggu: h1Minggu,
        harga2Minggu: h2Minggu,
        harga12Jam: h12Jam,
        harga9Jam: h9Jam,
        harga6Jam: h6Jam,
        harga3Jam: h3Jam,
        dendaHarianPerJam: dendaJam,
        fasilitas: fasilitas || '2 Helm SNI + Jas Hujan',
        spesifikasi: spesifikasi || '',
        imageUrl: imageUrl || '',
        isActive: true,
      })
      .returning();

    return NextResponse.json({ success: true, data: newModel }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating motor model:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
