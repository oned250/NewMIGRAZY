import { NextResponse } from 'next/server';
import { db, lacakUnits, armadaUnits, motorModels, penyewaan } from '@/lib/db';
import { eq, asc, desc, and } from 'drizzle-orm';

// GET /api/lacak-units - Monitoring real-time seluruh unit fisik (1 Unit = 1 Baris Aktif - D-26 & Opsi 3A)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const posisi = searchParams.get('posisi');
    const pool = searchParams.get('pool');
    const search = searchParams.get('search');

    const list = await db
      .select({
        id: lacakUnits.id,
        unitId: lacakUnits.unitId,
        kodeUnit: lacakUnits.kodeUnit,
        motorId: lacakUnits.motorId,
        statusPosisi: lacakUnits.statusPosisi,
        poolParkir: lacakUnits.poolParkir,
        namaBengkel: lacakUnits.namaBengkel,
        kontakBengkel: lacakUnits.kontakBengkel,
        estimasiSelesai: lacakUnits.estimasiSelesai,
        bookingId: lacakUnits.bookingId,
        noBooking: lacakUnits.noBooking,
        namaPenyewa: lacakUnits.namaPenyewa,
        tenggatKembali: lacakUnits.tenggatKembali,
        catatan: lacakUnits.catatan,
        updatedAt: lacakUnits.updatedAt,
        updatedBy: lacakUnits.updatedBy,
        // Armada unit joins
        nomorPlat: armadaUnits.nomorPlat,
        warna: armadaUnits.warna,
        poolDefault: armadaUnits.poolDefault,
        statusServis: armadaUnits.statusServis,
        kmTerakhir: armadaUnits.kmTerakhir,
        // Model motor joins
        namaModel: motorModels.namaModel,
        kategori: motorModels.kategori,
        harga1Hari: motorModels.harga1Hari,
      })
      .from(lacakUnits)
      .innerJoin(armadaUnits, eq(lacakUnits.unitId, armadaUnits.id))
      .innerJoin(motorModels, eq(lacakUnits.motorId, motorModels.id))
      .orderBy(asc(lacakUnits.kodeUnit));

    // Calculate live metrics across ALL units
    const stats = {
      total: list.length,
      parkirMalang: list.filter((u) => u.statusPosisi === 'parkir' && u.poolParkir === 'malang').length,
      parkirBatu: list.filter((u) => u.statusPosisi === 'parkir' && u.poolParkir === 'batu').length,
      servis: list.filter((u) => u.statusPosisi === 'servis').length,
      disewa: list.filter((u) => u.statusPosisi === 'disewa').length,
    };

    // Filter
    let filtered = list;

    if (posisi && posisi !== 'semua') {
      if (posisi === 'parkir_malang') {
        filtered = filtered.filter((u) => u.statusPosisi === 'parkir' && u.poolParkir === 'malang');
      } else if (posisi === 'parkir_batu') {
        filtered = filtered.filter((u) => u.statusPosisi === 'parkir' && u.poolParkir === 'batu');
      } else {
        filtered = filtered.filter((u) => u.statusPosisi === posisi);
      }
    }

    if (pool && pool !== 'semua') {
      filtered = filtered.filter((u) => u.poolParkir === pool || u.poolDefault === pool);
    }

    if (search && search.trim() !== '') {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.kodeUnit.toLowerCase().includes(q) ||
          u.nomorPlat.toLowerCase().includes(q) ||
          u.namaModel.toLowerCase().includes(q) ||
          (u.namaPenyewa && u.namaPenyewa.toLowerCase().includes(q)) ||
          (u.noBooking && u.noBooking.toLowerCase().includes(q)) ||
          (u.namaBengkel && u.namaBengkel.toLowerCase().includes(q))
      );
    }

    return NextResponse.json({
      success: true,
      data: filtered,
      stats,
      total: filtered.length,
    });
  } catch (error: any) {
    console.error('Error fetching lacak units:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
